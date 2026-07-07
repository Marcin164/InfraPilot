#!/usr/bin/env bash
#
# InfraPilot scheduled backup.
#
# Produces one encrypted bundle per run:
#   <BACKUP_DIR>/infrapilot-<env>-<UTC>.tar.gpg
#   <BACKUP_DIR>/infrapilot-<env>-<UTC>.tar.gpg.sha256
#
# Fans out to off-host destinations (S3, SSH) when configured.
# Prunes local bundles older than BACKUP_RETENTION_DAYS.
#
# Designed to be run from cron. Reads configuration exclusively from the
# environment — see .env.example.

set -euo pipefail

# ---------- config ----------

: "${PGHOST:?PGHOST is required}"
: "${PGPORT:=5432}"
: "${PGDATABASE:?PGDATABASE is required}"
: "${PGUSER:?PGUSER is required}"
: "${PGPASSWORD:?PGPASSWORD is required}"
export PGHOST PGPORT PGDATABASE PGUSER PGPASSWORD

: "${BACKUP_DIR:?BACKUP_DIR is required}"
: "${BACKUP_ENCRYPT_PASSPHRASE:?BACKUP_ENCRYPT_PASSPHRASE is required}"
: "${BACKUP_RETENTION_DAYS:=30}"
: "${BACKUP_ENV:=prod}"
UPLOADS_DIR="${UPLOADS_DIR:-}"

# Optional off-host destinations.
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-}"
BACKUP_S3_PREFIX="${BACKUP_S3_PREFIX:-infrapilot}"
BACKUP_SSH_TARGET="${BACKUP_SSH_TARGET:-}"

# ---------- helpers ----------

timestamp() { date -u +"%Y%m%dT%H%M%SZ"; }
log()       { printf '[%s] %s\n' "$(date -u +%FT%TZ)" "$*" >&2; }
die()       { log "ERROR: $*"; exit 1; }

require() {
  command -v "$1" >/dev/null 2>&1 || die "missing required tool: $1"
}

require pg_dump
require tar
require gpg
require sha256sum

# ---------- run ----------

TS="$(timestamp)"
NAME="infrapilot-${BACKUP_ENV}-${TS}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$BACKUP_DIR"

log "Starting backup ${NAME}"

# 1. DB dump (custom format, compressed).
log "pg_dump → ${WORK}/db.dump"
pg_dump --format=custom --compress=9 --no-owner --no-privileges \
        --file="${WORK}/db.dump"

# 2. Uploads (optional).
if [[ -n "$UPLOADS_DIR" && -d "$UPLOADS_DIR" ]]; then
  log "Packaging uploads from ${UPLOADS_DIR}"
  tar --directory "$(dirname "$UPLOADS_DIR")" \
      --create --gzip \
      --file="${WORK}/uploads.tgz" \
      "$(basename "$UPLOADS_DIR")"
else
  log "UPLOADS_DIR not set or missing — skipping uploads"
  : > "${WORK}/uploads.tgz"
fi

# 3. Manifest (pre-encryption integrity + provenance).
PG_SERVER_VER="$(psql -tAqc 'SHOW server_version;' 2>/dev/null || echo unknown)"
DB_SHA="$(sha256sum "${WORK}/db.dump" | awk '{print $1}')"
UP_SHA="$(sha256sum "${WORK}/uploads.tgz" | awk '{print $1}')"

cat >"${WORK}/manifest.json" <<EOF
{
  "name": "${NAME}",
  "createdAt": "$(date -u +%FT%TZ)",
  "env": "${BACKUP_ENV}",
  "pgServerVersion": "${PG_SERVER_VER}",
  "files": [
    {"path": "db.dump",     "sha256": "${DB_SHA}"},
    {"path": "uploads.tgz", "sha256": "${UP_SHA}"}
  ]
}
EOF

# 4. Bundle + encrypt.
log "Creating tar bundle"
TAR="${WORK}/${NAME}.tar"
tar --directory "$WORK" --create --file="$TAR" \
    manifest.json db.dump uploads.tgz

log "Encrypting with GPG AES-256"
ENC="${BACKUP_DIR}/${NAME}.tar.gpg"
# --passphrase-fd (not --passphrase) so the secret never appears as a
# command-line argument visible to other local users via `ps`.
gpg --batch --yes --quiet \
    --pinentry-mode loopback \
    --passphrase-fd 0 \
    --symmetric --cipher-algo AES256 \
    --output "$ENC" "$TAR" <<< "$BACKUP_ENCRYPT_PASSPHRASE"

# 5. Sidecar checksum on the encrypted file.
sha256sum "$ENC" > "${ENC}.sha256"
SIZE="$(stat -c%s "$ENC" 2>/dev/null || stat -f%z "$ENC")"
log "Produced ${ENC} (${SIZE} bytes)"

# 6. Off-host copies.
DESTS=("local:${BACKUP_DIR}")

if [[ -n "$BACKUP_S3_BUCKET" ]]; then
  require aws
  S3_URI="s3://${BACKUP_S3_BUCKET}/${BACKUP_S3_PREFIX}/"
  log "Uploading to ${S3_URI}"
  aws s3 cp "$ENC"          "$S3_URI" --only-show-errors
  aws s3 cp "${ENC}.sha256" "$S3_URI" --only-show-errors
  DESTS+=("s3:${S3_URI}")
fi

if [[ -n "$BACKUP_SSH_TARGET" ]]; then
  require scp
  log "Copying to ${BACKUP_SSH_TARGET}"
  scp -q "$ENC" "${ENC}.sha256" "$BACKUP_SSH_TARGET"
  DESTS+=("ssh:${BACKUP_SSH_TARGET}")
fi

# 7. Retention — local only.
log "Pruning local bundles older than ${BACKUP_RETENTION_DAYS} days"
PRUNED=0
while IFS= read -r -d '' old; do
  rm -f -- "$old" "${old}.sha256"
  PRUNED=$((PRUNED + 1))
done < <(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'infrapilot-*.tar.gpg' \
              -mtime "+${BACKUP_RETENTION_DAYS}" -print0)
log "Pruned ${PRUNED} old bundle(s)"

# 8. Record the run in the app audit log (best-effort).
if [[ -n "${AUDIT_LOG_URL:-}" && -n "${AUDIT_LOG_TOKEN:-}" ]]; then
  curl -sS -X POST "$AUDIT_LOG_URL" \
       -H "Authorization: Bearer ${AUDIT_LOG_TOKEN}" \
       -H 'Content-Type: application/json' \
       -d "$(cat <<JSON
{
  "entityType": "Backup",
  "entityId": "${NAME}",
  "action": "created",
  "metadata": {
    "size": ${SIZE},
    "sha256": "$(awk '{print $1}' "${ENC}.sha256")",
    "destinations": $(printf '%s\n' "${DESTS[@]}" | jq -R . | jq -s .),
    "pgServerVersion": "${PG_SERVER_VER}"
  }
}
JSON
)" || log "WARN: audit log post failed (non-fatal)"
fi

log "Backup ${NAME} completed OK"
