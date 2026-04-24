# LanVentory — DSAR procedure (GDPR Art. 15 / 17)

This document is the operational handbook for Data Subject Access Requests.
It sits next to the UI the DPO uses: the procedure here tells the auditor
*how* a request is handled; the audit log proves it *was* handled.

## Scope

- **Art. 15 — Right of access.** Subject asks "what do you have on me?".
  We produce a signed ZIP covering every table that references the user.
- **Art. 17 — Right to erasure.** Subject asks to be forgotten. We
  anonymise the user row while respecting overrides (legal hold, append-
  only audit chain).
- **Out of scope:** Art. 16 (rectification) — handled by normal user
  editing. Art. 20 (portability) is served by the same ZIP as Art. 15.

Only users with the **DPO** role (or Admin) can initiate access exports or
erasure. Every action is written to the tamper-evident audit chain under
`entityType = 'PrivacyRecord'`.

---

## Roles and approvals

| Action                       | Who                            | Extra approval                       |
|------------------------------|--------------------------------|--------------------------------------|
| Look up personal data (`read`) | DPO                            | —                                     |
| Export ZIP (Art. 15)         | DPO                            | —                                     |
| Create legal hold            | DPO or Compliance              | —                                     |
| Release legal hold           | DPO or Compliance              | Written reason (goes to audit)        |
| Erase user (Art. 17)         | DPO                            | Written reason (goes to audit); blocked if any active hold |

Admin implicitly passes role checks but is not expected to operate DSAR in
normal workflow. If Admin acts, the audit entry records Admin as actor
and the Compliance officer should review.

---

## Intake (day 0)

1. Request lands via email / web form / post.
2. DPO creates a tracking ticket (category = `DSAR`) with:
   - Subject full name + contact channel used
   - Requested right (15 / 17 / both)
   - Identity-proof method (photo ID on file, prior login, manager attestation)
3. GDPR clock starts: **30 calendar days to respond** (extendable once by
   60 days for complex requests — must notify subject in writing within
   the first 30).

Identity proof is a policy decision, not enforced by the app. Until the
DPO is satisfied, do not click any button in the Privacy dialog.

---

## Art. 15 — export procedure

1. Open the user in the Users table → *View as DPO*.
2. Click **Export all data (Art. 15)**.
3. Backend streams a ZIP named `dsar-<userId>-<uuid>.zip` containing:
   - `user.json` — the full user row.
   - `devices.json`, `tickets_as_requester.json`,
     `tickets_as_assignee.json`, `ticket_activity.json`,
     `ticket_approvals.json`, `histories.json`, `history_approvers.json`,
     `user_settings.json`, `dashboards.json`, `flows.json`, `forms.json`,
     `assignment_group_members.json` — every table referencing the user.
   - `audit_user.jsonl` — audit chain entries where `entityType='User'
     AND entityId=userId`.
   - `audit_privacy.jsonl` — audit entries where `entityType='PrivacyRecord'`
     (every prior read/export/erasure touching this subject).
   - `legal_holds.json` — all holds for this subject (active and released).
   - `manifest.json` — request id, generator, timestamp, per-file SHA256.
   - `manifest.sig` — SHA256 of `manifest.json`.
4. The export is logged as
   `PrivacyRecord | <userId> | export_generated | { requestId, actor, summary, manifestSha256 }`.
5. DPO delivers the ZIP to the subject over the channel they requested
   (encrypted email, portal download, USB at a counter). Delivery method
   is added to the DSAR ticket — not the app's responsibility to track.

If a report later comes back claiming something is missing, use the
`manifest.sig` to prove the bundle wasn't altered after generation.

---

## Art. 17 — erasure procedure

### Pre-flight

1. Open the user → **View as DPO**.
2. Scroll to **Legal holds**. If any row is `active`, erasure is blocked.
   - Review each active hold: is its `retainUntil` still valid? Is the
     underlying reason (tax, labour law, litigation hold) still in force?
   - If obsolete, release it (button → reason → confirm). Releases log
     to audit.
3. If an active hold cannot be released, erasure **must be refused**.
   Write the refusal letter citing the hold's `legalBasis`. The refusal
   itself is not an app event — keep a copy in the DSAR ticket.

### Execute

1. Fill the **Reason** field (required — written to audit).
2. Click **Erase user data** → confirm.
3. Backend performs:
   - Rechecks active holds. On any hit → `409` + `erase_rejected` audit.
   - NULLs every PII field on the user row: `name`, `surname`,
     `username`, `email`, `phone`, `title`, `distinguishedName`,
     `streetAddress`, `city`, `postalCode`, `country`, `manager`, `office`,
     `department`, `company`, `authUserId`, `memberOf`,
     `userAccountControl`, `pwdLastSet`.
   - Sets `erasedAt = now()`, `erasureReason = <text>`.
   - NULLing `authUserId` severs the PropelAuth link — the subject
     cannot log in again.
4. Response body lists exactly which fields were nulled and which items
   were retained (with reason). Screenshot or copy it into the DSAR
   ticket.
5. Audit entry:
   `PrivacyRecord | <userId> | erased | { requestId, actor, reason, fieldsNulled, itemsRetained, article: 'GDPR Art. 17' }`.

### What remains

| Remaining                          | Why it is lawful                          |
|------------------------------------|-------------------------------------------|
| User row (opaque UUID only)        | Keeps historical foreign keys consistent  |
| `system_audit_log` entries mentioning the UUID | Art. 17(3)(b)/(e): legal obligation + defence of legal claims. Chain is append-only by design; partial deletion would break the tamper-evident proof |
| `erasedAt`, `erasureReason`        | Evidence the erasure happened and why     |
| Data under active legal hold       | Art. 17(3)(b)/(e) — documented exceptions |

The response to the subject cites this list. Do not promise more than
what actually happened.

---

## Legal holds — when to create one

Create a hold when a specific legal or regulatory rule requires keeping
data *beyond* the normal retention schedule, or when erasure would
frustrate a known purpose (litigation, investigation, tax audit).

Required fields:

- **userId** — whose data to retain.
- **reason** — one sentence the auditor will understand.
- **legalBasis** — the statute/article/contract clause. Optional in the
  schema, but the audit trail is thin without it.
- **retainUntil** — when the hold should expire. Leave empty for
  indefinite (then re-review annually).

Holds are audited: `LegalHold | <id> | created` and `released`.

The normal retention jobs (Phase 3) must check for active holds before
purging any row referencing the user. That check is enforced at the
erasure boundary (here) and should be added to any bulk retention job
that targets user-referenced tables.

---

## Monthly / annual review checklist

- List active holds with `retainUntil IS NULL`. For each, confirm the
  underlying reason still applies. Release stale ones.
- List erasures in the last 30 days. Spot-check three: is the ZIP (or
  refusal letter) archived in the DSAR tracking ticket?
- Verify the audit chain (`GET /audit/verify`). If it returns anything
  other than `ok: true`, stop: the erasure evidence is untrustworthy.
- Cross-check that no PII field survived erasure. Quick SQL:
  ```sql
  SELECT id, erasedAt
  FROM users
  WHERE erasedAt IS NOT NULL
    AND (name IS NOT NULL OR surname IS NOT NULL OR email IS NOT NULL);
  ```
  Empty result expected.

---

## Known limits (accepted risk)

- **File attachments in `backend/uploads/`** are not scrubbed by erasure.
  The index JSON in the ZIP references them by path, but the files
  themselves stay. Any attachment containing personal data must be
  handled manually; consider extending `eraseUser` to unlink uploads
  associated via `tickets.attachments` if that becomes material.
- **External systems** (PropelAuth, Active Directory, external log
  sinks) are out of scope of this procedure. Coordinate separately —
  our audit log records that we erased *our* copy; upstream erasure is
  the identity provider's responsibility.
- **Backups.** Encrypted backup bundles still contain the subject's data
  until they age out under retention (see `ops/backup/README.md §6`).
  This is lawful under Art. 17(3)(e) as long as retention is bounded and
  documented; cite that in refusal letters if a subject asks.

---

_This document is versioned. `git log ops/dsar/README.md` is the change
history._
