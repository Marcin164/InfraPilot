# InfraPilot — Ansible deployment

Automates the manual procedure in [`DEPLOYMENT.md`](../../DEPLOYMENT.md):
installs Docker, checks out the repo, writes `.env`, builds/starts the
Compose stack, configures Nginx, and issues a Let's Encrypt certificate.

`DEPLOYMENT.md` remains the authoritative description of *why* each step
exists. This playbook is its automated form — if the procedure changes,
update both.

Target: Ubuntu 22.04+, reachable over SSH, Python 3 present (stock on
Ubuntu cloud images).

## Setup

1. Install Ansible locally (control machine, not the server):
   ```bash
   pip install ansible
   ```
   The optional firewall tag needs one extra collection:
   ```bash
   ansible-galaxy collection install community.general
   ```

2. Inventory — copy and fill in your server(s):
   ```bash
   cp inventory/hosts.example.ini inventory/hosts.ini
   ```

3. Variables/secrets — copy and fill in:
   ```bash
   cp group_vars/all.example.yml group_vars/all.yml
   ```
   `group_vars/all.yml` and `inventory/hosts.ini` are gitignored — they hold
   real secrets (DB password, encryption key, PropelAuth API key) and must
   never be committed. For anything beyond solo/local use, encrypt it:
   ```bash
   ansible-vault encrypt group_vars/all.yml
   ```

4. Repo access — `app_repo_url` is cloned by the target host as
   `deploy_user` (root by default). If the repo is private, make sure that
   user's SSH agent/key (or a deploy key on the server) can pull it — the
   playbook doesn't set up git credentials for you.

## Run

Full run (first deploy or after changing anything):
```bash
ansible-playbook playbook.yml
# or, if group_vars/all.yml is vault-encrypted:
ansible-playbook playbook.yml --ask-vault-pass
```

Targeted re-runs with tags — useful once the server is already up and you
only touched one piece:
```bash
ansible-playbook playbook.yml --tags env,compose   # changed .env, redeploy
ansible-playbook playbook.yml --tags nginx,tls     # changed domain/TLS
ansible-playbook playbook.yml --tags app,compose   # git pull + rebuild
```

Available tags: `docker`, `app`, `env`, `compose`, `nginx`, `tls`, `firewall`.

## What it does NOT do

Same scope as `DEPLOYMENT.md` — it does not cover:
- PropelAuth dashboard config (allowed origins) — set manually, see main doc.
- DNS (pointing `app_domain` at the server's IP) — do this before running
  the `tls` tag, or certbot's HTTP-01 challenge will fail.
- Backups (`ops/backup/`) or DSAR tooling (`ops/dsar/`) — separate, unrelated
  to provisioning.

## Idempotency notes

- Docker install steps and the apt repo are safe to re-run.
- `git` checkout only fast-forwards; it won't discard local changes on the
  server (there shouldn't be any — the server is a deploy target, not a
  dev checkout).
- `docker compose up -d --build` is safe to re-run; Compose only recreates
  containers whose config actually changed.
- The certbot task is skipped once the certificate already exists
  (`creates:` guard) — for renewal, `certbot`'s own systemd timer handles
  that after the first successful run, not this playbook.
