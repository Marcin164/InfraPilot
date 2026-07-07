# Package signing

`infrapilot-packages-public.asc` is the public key `build.sh` signs
`.deb` releases with, and the one the generated Linux bootstrap script
(`devices.controller.ts`'s `agentBootstrapScript`) verifies against
before running `dpkg -i` — see `backend/src/config/packageSigningKey.ts`,
which must stay byte-for-byte in sync with this file.

**The key committed here right now is a test/demo key** (see its own
identity string: "TEST KEY - regenerate for production"), generated to
prove the sign → publish → verify pipeline actually works end-to-end.
It has no real custody behind it. Before using this in production:

1. Generate a real key pair on a machine that is **not** the server that
   serves the `.deb` for download — if the signing key and the file
   host are the same machine, a compromise of that machine defeats the
   signature entirely (see the audit's write-up on the "public key
   distribution" problem).
2. Replace this file with the new public key, and update
   `backend/src/config/packageSigningKey.ts` to match.
3. Keep the private key on that separate machine (or a hardware token /
   HSM) and set `SIGNING_KEY_ID` there when running `build.sh`. Never
   commit a private key to this repo.
4. Decide a rotation/revocation plan — already-installed agents have no
   mechanism to fetch an updated trusted key automatically; a key
   rotation needs a coordinated update to this file + the backend
   constant + a new release.
