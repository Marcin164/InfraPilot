# InfraPilot — Backup & Disaster Recovery

This document is the authoritative backup and DR plan for InfraPilot. It
answers the questions an auditor will ask:

- Where do database snapshots go?
- What is the RPO and RTO?
- Who is allowed to restore, and how is the action logged?
- How do we prove the procedure works?

The accompanying scripts (`backup.sh`, `restore.sh`, `verify.sh`) are the
executable counterpart of this document. Every change to the plan must be
reflected in both.

---

## 1. Scope

In scope:

- PostgreSQL database `AssetManager` (all application data, including the
  tamper-evident `system_audit_log`).
- `backend/uploads/` directory (ticket attachments, form uploads).
- Application configuration (`.env`, Nest config) — versioned in Git; no
  separate backup required.

Out of scope:

- PropelAuth identity data — backed up by PropelAuth itself, treated as an
  external system of record.
- External log sinks (file/HTTP) — destination-side retention, not ours.
- OS / host configuration — covered by the infrastructure team's host
  lifecycle, not by this plan.

## 2. Objectives (RPO / RTO)

| Target | Value         | Rationale                                          |
|--------|---------------|----------------------------------------------------|
| RPO    | **24 hours**  | Nightly snapshots. Max acceptable data loss.       |
| RTO    | **4 hours**   | Time to usable service after declared disaster.    |

Current architecture does **not** use PITR (continuous WAL archiving); if
RPO needs to drop below 24 h, enable WAL shipping (`archive_mode=on`,
`archive_command`) and extend `restore.sh` with `recovery_target_time`. The
plan is intentionally sized to match a small-to-mid team; auditor should
confirm these targets are acceptable for the regulatory framework in play
(ISO 27001 A.17 / SOC 2 CC7).

## 3. What gets backed up

A single encrypted bundle per run, produced by `backup.sh`:

```
infrapilot-<env>-<UTC-timestamp>.tar.gpg      # encrypted archive
infrapilot-<env>-<UTC-timestamp>.tar.gpg.sha256   # integrity sidecar
```

Archive contents (before encryption):

```
manifest.json       # file list, sizes, SHA256, PG version, app version
db.dump             # pg_dump -Fc (custom format, compressed)
uploads.tgz         # tar.gz of backend/uploads (may be empty)
```

## 4. Storage destinations

`backup.sh` writes to whichever of these are configured. **At least one
off-host destination is required for DR readiness.**

| Destination  | Env var                     | Notes                                    |
|--------------|-----------------------------|------------------------------------------|
| Local dir    | `BACKUP_DIR`                | First copy. Same host — not DR-safe alone. |
| S3-compatible| `BACKUP_S3_BUCKET`, `BACKUP_S3_PREFIX`, plus standard `AWS_*` | Off-site copy via `aws s3 cp`.     |
| Remote SSH   | `BACKUP_SSH_TARGET` (user@host:/path) | Off-host copy via `scp`. Requires key auth. |

Principle: **3-2-1** — at least 3 copies, 2 different media, 1 off-site.
Local `BACKUP_DIR` + S3 (or SSH) satisfies this.

## 5. Encryption and integrity

- Symmetric encryption with GPG AES-256. Passphrase read from
  `BACKUP_ENCRYPT_PASSPHRASE` (env var) — store in a secrets manager, not
  in source control, not on the DB host.
- Passphrase rotation: every 12 months, or immediately on personnel
  change. Old passphrase must be retained in escrow for the remainder of
  the 7-year retention window to restore legacy bundles.
- Integrity: SHA256 of the encrypted bundle is written to a `.sha256`
  sidecar and uploaded alongside. `restore.sh` and `verify.sh` refuse to
  proceed on checksum mismatch.

## 6. Retention

| Tier              | Keep for      | Where               |
|-------------------|---------------|---------------------|
| Daily snapshot    | 30 days       | Local + S3/SSH      |
| Weekly snapshot   | 12 weeks      | S3 (separate prefix)|
| Monthly snapshot  | 12 months     | S3 (separate prefix)|
| Annual snapshot   | **7 years**   | S3 Glacier / offline|

`backup.sh` enforces the **30-day local** rule automatically. Weekly /
monthly / annual promotion is a lifecycle rule on the bucket — see the
infra terraform/module that owns the bucket (out of scope for this repo).

Audit log rows themselves are append-only and **never pruned** regardless
of retention; the chain must remain contiguous for verification.

## 7. Access control — who can do what

Principle: backup is unattended and automated; restore is manual and
two-person.

| Action                          | Who                                      | How it is logged                      |
|---------------------------------|------------------------------------------|---------------------------------------|
| Run scheduled backup            | `infrapilot-backup` service account      | `backup.sh` writes to `system_audit_log` via `audit.log('Backup', id, 'created', …)` on completion |
| Inspect backup bundle metadata  | Admin, Auditor                           | Read-only S3 role                     |
| Decrypt passphrase              | Ops on-call + one Compliance officer     | Vault audit log (PropelAuth / secrets manager) |
| Execute `restore.sh`            | Ops on-call, with Compliance approval    | `restore.sh` logs to `system_audit_log` (`action='restored'`) and records approver in metadata |
| Execute `verify.sh` (drill)     | CI pipeline or Auditor                   | Writes drill result to audit log      |
| Rotate encryption passphrase    | Ops lead                                 | Vault audit log + written change ticket |

Segregation of duties: the service account that produces backups must not
be the same identity that can delete them from S3 (bucket policy denies
`DeleteObject` for `infrapilot-backup`). Object Lock / versioning should
be enabled on the S3 bucket for the 7-year tier.

## 8. Schedule

| Job                    | Cadence              | Runs as                 |
|------------------------|----------------------|-------------------------|
| `backup.sh`            | Daily 02:00 UTC      | `cron` / Task Scheduler |
| `verify.sh`            | Weekly, Sunday 04:00 | CI                      |
| Full DR drill (manual) | Quarterly            | Ops + Auditor joint     |

Quarterly drill is documented in a change ticket and results are attached
to the compliance evidence pack (Phase 3 work).

## 9. Restore runbook

The authoritative procedure is executed by `restore.sh`. The operator
steps below exist so a human can follow them when the script is not
available (e.g. restoring to a greenfield environment).

1. **Confirm disaster.** Write the incident ticket. Get explicit go-ahead
   from Compliance (one approver, recorded by name in the incident).
2. **Provision target host.** Install PostgreSQL matching the source
   major version (`pg_dump` custom format is portable across minors, not
   majors).
3. **Fetch bundle.** From S3 or the last known-good local copy. Prefer
   the most recent bundle whose `verify.sh` run was green.
4. **Verify checksum.** `sha256sum -c <bundle>.sha256`. Abort on mismatch.
5. **Decrypt.** `gpg --decrypt` using the passphrase released by the
   secrets manager. Passphrase release itself is audited.
6. **Restore DB.**
   ```bash
   createdb AssetManager
   pg_restore --clean --if-exists --no-owner --no-privileges \
              -d AssetManager db.dump
   ```
7. **Restore uploads.** `tar -xzf uploads.tgz -C backend/`.
8. **Start app.** Boot Nest; it runs migrations idempotently and
   re-installs the append-only audit trigger on startup.
9. **Verify audit chain.** Hit `GET /audit/verify` — must return
   `ok: true`. Non-ok means the restored snapshot was tampered with or
   truncated; escalate.
10. **Smoke test.** Log in, open a ticket, check a device record.
11. **Record outcome.** Update the incident ticket with RTO actually
    achieved, attach the `restore.sh` log. The restore itself is in
    `system_audit_log`.

## 10. DR drill — `verify.sh`

Runs weekly in CI against the most recent bundle:

1. Decrypt → extract → restore into a scratch database named
   `infrapilot_drill_<timestamp>`.
2. Recomputes the audit hash chain end-to-end and rejects on any
   mismatch.
3. Runs lightweight sanity queries (row counts on core tables).
4. Drops the scratch database.
5. Emits one record to `system_audit_log` with the drill outcome.

Drill failures page the on-call engineer. A backup that has not been
successfully verified within 14 days is treated as not-restorable for
compliance purposes.

## 11. Audit trail for backups and restores

When `AUDIT_LOG_URL` + `AUDIT_LOG_TOKEN` are configured, the scripts post
to the application audit log so the action ends up in the tamper-evident
chain alongside normal business events:

| action        | entityType | metadata                                       |
|---------------|-----------|------------------------------------------------|
| `created`     | `Backup`  | `size`, `sha256`, `destinations`, `pgServerVersion` |
| `verified`    | `Backup`  | `sha256`, `chainOk`, `chainRows`, `rowCounts` |
| `restored`    | `Backup`  | `sha256`, `approver`, `targetDb`, `rto_s`      |

> **Current state:** the companion `POST /audit/ingest` endpoint is
> **not yet shipped**. The scripts will emit the audit entry on a
> best-effort basis — a failed post is logged and ignored so cron runs
> don't page on it. When the ingest endpoint lands, every backup will
> appear in the chain.
>
> Until then, the backup cron log itself is the evidence of record.
> Archive `/var/log/infrapilot-backup.log` alongside the bundles.

This pattern matches the "who/when/what" evidence an auditor expects
during ISO 27001 A.12.3 and SOC 2 CC7.2 interviews.

## 12. Known gaps (accepted risk)

- **No PITR.** RPO capped at 24 h. Accept until regulatory need justifies
  the extra operational complexity of WAL shipping.
- **Single-region S3.** Bucket is single-region. Cross-region replication
  can be enabled on the bucket without code changes.
- **Passphrase custodianship.** Two-person passphrase custody is policy;
  not technically enforced. Vault access is the compensating control.

Any change to this gap list requires a written risk acceptance from the
Compliance officer.

---

_Last reviewed: set your own date. This file is versioned; `git log`
is the authoritative change history._
