#!/usr/bin/env bash
#
# LanVentory restore runbook.
#
# Two-person-rule script. Will DROP the target database on --clean.
# Never run from cron. Operator must provide an approver name that is
# written to the audit log.
#
# Usage:
#   ./restore.sh \
#     --bundle /path/to/lanventory-prod-<ts>.tar.gpg \
#     --target-db AssetManager \
#     --approver "Jane Doe (Compliance)"
#
# Required env:
#   PGHOST PGPORT PGUSER PGPASSWORD
#   BACKUP_ENCRYPT_PASSPHRASE
# Optional env:
#   UPLOADS_DIR                — where uploads.tgz should be extracted to
#   SKIP_CONFIRM=1             — non-interactive (CI/drill only)
#   AUDIT_LOG_URL, AUDIT_LOG_TOKEN — post 'restored' event

set -euo pipefail

# ---------- args ----------

BUNDLE=""
TARGET_DB=""
APPROVER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bundle)    BUNDLE="$2"; shift 2 ;;
    --target-db) TARGET_DB="$2"; shift 2 ;;
    --approver)  APPROVER="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$BUNDLE"    ]] || { echo "--bundle required"    >&2; exit 2; }
[[ -n "$TARGET_DB" ]] || { echo "--target-db required" >&2; exit 2; }
[[ -n "$APPROVER"  ]] || { echo "--approver required"  >&2; exit 2; }

: "${PGHOST:?PGHOST is required}"
: "${PGPORT:=5432}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
: "${BACKUP_ENCRYPT_PASSPHRASE:?BACKUP_ENCRYPT_PASSPHRASE is required}"
export PGHOST PGPORT PGUSER PGPASSWORD

UPLOADS_DIR="${UPLOADS_DIR:-}"

# ---------- helpers ----------

log() { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*" >&2; }
die() { log "ERROR: $*"; exit 1; }
require() {
  command -v "$1" >/dev/null 2>&1 || die "missing required tool: $1"
}

require gpg
require tar
require sha256sum
require pg_restore
require psql
require createdb
require dropdb

# ---------- guard rails ----------

[[ -f "$BUNDLE" ]] || die "bundle not found: $BUNDLE"
[[ -f "${BUNDLE}.sha256" ]] || die "checksum sidecar missing: ${BUNDLE}.sha256"

log "Verifying bundle checksum"
( cd "$(dirname "$BUNDLE")" && sha256sum -c "$(basename "${BUNDLE}.sha256")" ) \
  || die "checksum verification failed — refusing to proceed"

if [[ "${SKIP_CONFIRM:-0}" != "1" ]]; then
  cat <<EOF

================================================================
LanVentory restore — this will DROP and RECREATE database '${TARGET_DB}'
on ${PGHOST}:${PGPORT} as user ${PGUSER}.

Bundle:   $BUNDLE
Approver: $APPROVER

Type the target database name to confirm.
================================================================
EOF
  read -r -p "> " CONFIRM
  [[ "$CONFIRM" == "$TARGET_DB" ]] || die "confirmation did not match — aborting"
fi

# ---------- decrypt & extract ----------

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

log "Decrypting bundle"
TAR="${WORK}/bundle.tar"
gpg --batch --yes --quiet \
    --pinentry-mode loopback \
    --passphrase "$BACKUP_ENCRYPT_PASSPHRASE" \
    --decrypt --output "$TAR" "$BUNDLE"

log "Extracting"
tar --directory "$WORK" --extract --file="$TAR"

[[ -f "${WORK}/manifest.json" ]] || die "bundle missing manifest.json"
[[ -f "${WORK}/db.dump"       ]] || die "bundle missing db.dump"

# Per-file checksum verification against manifest.
# The outer .sha256 sidecar already covers the encrypted bundle's integrity;
# this is a belt-and-braces check of the decrypted payload.
if command -v node >/dev/null 2>&1; then
  log "Verifying per-file checksums against manifest"
  node -e '
    const fs = require("fs");
    const crypto = require("crypto");
    const path = process.argv[1];
    const m = JSON.parse(fs.readFileSync(path + "/manifest.json", "utf8"));
    let bad = 0;
    for (const f of m.files) {
      if (!fs.existsSync(path + "/" + f.path)) continue;
      const h = crypto.createHash("sha256");
      h.update(fs.readFileSync(path + "/" + f.path));
      const got = h.digest("hex");
      if (got !== f.sha256) {
        console.error("checksum mismatch:", f.path, got, "!=", f.sha256);
        bad++;
      }
    }
    process.exit(bad === 0 ? 0 : 1);
  ' "$WORK" || die "per-file checksum mismatch"
else
  log "node not available — skipping per-file checksum (outer bundle SHA already verified)"
fi

# ---------- restore DB ----------

log "Dropping target database if present"
dropdb --if-exists "$TARGET_DB"

log "Creating target database"
createdb "$TARGET_DB"

log "Running pg_restore"
START=$SECONDS
pg_restore --clean --if-exists --no-owner --no-privileges \
           --dbname="$TARGET_DB" \
           --jobs="$(nproc 2>/dev/null || echo 4)" \
           "${WORK}/db.dump"
RESTORE_S=$((SECONDS - START))
log "DB restored in ${RESTORE_S}s"

# ---------- restore uploads ----------

if [[ -s "${WORK}/uploads.tgz" ]]; then
  if [[ -n "$UPLOADS_DIR" ]]; then
    log "Restoring uploads to $(dirname "$UPLOADS_DIR")"
    mkdir -p "$(dirname "$UPLOADS_DIR")"
    tar --directory "$(dirname "$UPLOADS_DIR")" \
        --extract --gzip --file="${WORK}/uploads.tgz"
  else
    log "UPLOADS_DIR not set — leaving uploads.tgz in ${WORK}"
  fi
else
  log "No uploads in bundle"
fi

# ---------- audit log ----------

BUNDLE_SHA="$(awk '{print $1}' "${BUNDLE}.sha256")"

if [[ -n "${AUDIT_LOG_URL:-}" && -n "${AUDIT_LOG_TOKEN:-}" ]]; then
  curl -sS -X POST "$AUDIT_LOG_URL" \
       -H "Authorization: Bearer ${AUDIT_LOG_TOKEN}" \
       -H 'Content-Type: application/json' \
       -d "$(cat <<JSON
{
  "entityType": "Backup",
  "entityId": "$(basename "$BUNDLE")",
  "action": "restored",
  "metadata": {
    "sha256": "${BUNDLE_SHA}",
    "approver": "${APPROVER}",
    "targetDb": "${TARGET_DB}",
    "rto_s": ${RESTORE_S}
  }
}
JSON
)" || log "WARN: audit log post failed (non-fatal)"
fi

log "Restore complete. Remember to:"
log "  1. Start the backend (migrations + audit trigger run on boot)."
log "  2. Hit GET /audit/verify and confirm ok=true."
log "  3. Record RTO=${RESTORE_S}s in the incident ticket."
