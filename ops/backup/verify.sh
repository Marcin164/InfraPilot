#!/usr/bin/env bash
#
# InfraPilot weekly DR drill.
#
# Takes the most recent encrypted bundle (or a specified one), restores it
# to a throw-away database, recomputes the audit hash chain, runs sanity
# queries, and drops the scratch DB. Exits non-zero on any failure.
#
# Designed for CI. Writes one entry to the app audit log with the outcome.
#
# Usage:
#   ./verify.sh                   # picks newest bundle in $BACKUP_DIR
#   ./verify.sh --bundle <path>   # verify a specific bundle

set -euo pipefail

BUNDLE="${1:-}"
if [[ "$BUNDLE" == "--bundle" ]]; then
  BUNDLE="${2:?path required after --bundle}"
fi

: "${PGHOST:?PGHOST is required}"
: "${PGPORT:=5432}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${BACKUP_DIR:?BACKUP_DIR is required}"
: "${BACKUP_ENCRYPT_PASSPHRASE:?BACKUP_ENCRYPT_PASSPHRASE is required}"
export PGHOST PGPORT PGUSER PGPASSWORD

log() { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }

# Pick newest bundle if not specified.
if [[ -z "$BUNDLE" ]]; then
  BUNDLE="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'infrapilot-*.tar.gpg' \
              -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -n1 | awk '{print $2}')"
  [[ -n "$BUNDLE" ]] || die "no bundles found in $BACKUP_DIR"
fi

log "Verifying bundle: $BUNDLE"

SCRATCH_DB="infrapilot_drill_$(date -u +%Y%m%d%H%M%S)"
export SKIP_CONFIRM=1

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

log "Restoring into scratch database ${SCRATCH_DB}"
"${SCRIPT_DIR}/restore.sh" \
  --bundle "$BUNDLE" \
  --target-db "$SCRATCH_DB" \
  --approver "drill-automation"

# Cleanup even on failure.
cleanup() {
  log "Dropping scratch database ${SCRATCH_DB}"
  PGDATABASE=postgres dropdb --if-exists "$SCRATCH_DB" || true
}
trap cleanup EXIT

export PGDATABASE="$SCRATCH_DB"

# ---------- 1. audit chain verification ----------

log "Recomputing audit hash chain"
CHAIN_RESULT="$(psql -tAq <<'SQL'
WITH ordered AS (
  SELECT
    sequence,
    "entityType",
    "entityId",
    action,
    metadata,
    "createdAt",
    hash,
    "prevHash",
    LAG(hash) OVER (ORDER BY sequence) AS expected_prev
  FROM system_audit_log
  WHERE hash IS NOT NULL
  ORDER BY sequence
)
SELECT
  COUNT(*)                                                     AS total,
  COUNT(*) FILTER (WHERE "prevHash" IS DISTINCT FROM expected_prev
                   AND sequence <> (SELECT MIN(sequence) FROM ordered)) AS chain_breaks
FROM ordered;
SQL
)"

TOTAL="$(echo "$CHAIN_RESULT" | awk -F'|' '{print $1}')"
BREAKS="$(echo "$CHAIN_RESULT" | awk -F'|' '{print $2}')"
log "Audit rows: ${TOTAL}, chain breaks: ${BREAKS}"

if [[ "$BREAKS" != "0" ]]; then
  die "audit chain is broken (${BREAKS} mismatches) — bundle is not trustworthy"
fi

# Note: this SQL verifies prev_hash linkage but not the SHA256 of each row.
# A full hash re-computation requires the app's canonical JSON function.
# For that, boot a Nest worker pointed at SCRATCH_DB and hit /audit/verify.
# This SQL check is the cheap CI signal; the deep check is the quarterly drill.

# ---------- 2. sanity row counts ----------

log "Row counts on core tables"
psql -tAq <<'SQL' | tee /tmp/verify_rows.txt
SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'devices',          COUNT(*) FROM devices
UNION ALL SELECT 'tickets',          COUNT(*) FROM tickets
UNION ALL SELECT 'system_audit_log', COUNT(*) FROM system_audit_log;
SQL

# Any table returning 0 rows in prod is suspicious. Flag but don't fail — a
# fresh environment legitimately has no tickets.
while IFS='|' read -r table count; do
  [[ -z "$table" ]] && continue
  if [[ "$count" -eq 0 ]]; then
    log "WARN: table ${table} has 0 rows"
  fi
done < /tmp/verify_rows.txt

# ---------- 3. audit log ----------

BUNDLE_SHA="$(awk '{print $1}' "${BUNDLE}.sha256" 2>/dev/null || echo unknown)"

if [[ -n "${AUDIT_LOG_URL:-}" && -n "${AUDIT_LOG_TOKEN:-}" ]]; then
  ROWS_JSON="$(awk -F'|' 'NF==2 {printf "\"%s\": %s,", $1, $2}' /tmp/verify_rows.txt | sed 's/,$//')"
  curl -sS -X POST "$AUDIT_LOG_URL" \
       -H "Authorization: Bearer ${AUDIT_LOG_TOKEN}" \
       -H 'Content-Type: application/json' \
       -d "$(cat <<JSON
{
  "entityType": "Backup",
  "entityId": "$(basename "$BUNDLE")",
  "action": "verified",
  "metadata": {
    "sha256": "${BUNDLE_SHA}",
    "chainOk": true,
    "chainRows": ${TOTAL},
    "rowCounts": {${ROWS_JSON}}
  }
}
JSON
)" || log "WARN: audit log post failed (non-fatal)"
fi

log "Drill passed"
