/**
 * Public key used to verify the Linux agent .deb before the bootstrap
 * script runs `dpkg -i` (see devices.controller.ts's agentBootstrapScript).
 * Must stay byte-for-byte in sync with
 * linuxApp/installer/infrapilot-packages-public.asc — see
 * linuxApp/installer/PACKAGE_SIGNING.md for the full signing pipeline and
 * key-custody notes.
 *
 * TEST KEY — see PACKAGE_SIGNING.md. Not backed by real key custody yet.
 */
export const LINUX_PACKAGE_SIGNING_PUBLIC_KEY = `-----BEGIN PGP PUBLIC KEY BLOCK-----

mDMEaky59RYJKwYBBAHaRw8BAQdA7/m9FOcrZXTrmTDuFdb4szrAo075RFHyNJ7x
AE8pWLq0X0luZnJhUGlsb3QgUGFja2FnZSBTaWduaW5nIChURVNUIEtFWSAtIHJl
Z2VuZXJhdGUgZm9yIHByb2R1Y3Rpb24pIDxwYWNrYWdlc0BpbmZyYXBpbG90Lmlu
dmFsaWQ+iJYEExYKAD4WIQRI3x26BvPNB+aYoC6PwaANMBCzFQUCaky59QIbAwUJ
A8JnAAULCQgHAgYVCgkICwIEFgIDAQIeAQIXgAAKCRCPwaANMBCzFaPTAQD+x7yX
OhnFuFTnCLubMG0/5XbvbN53YxavcuZcfGF/nAEAqpTJhyot2pvfRKSdZN9ArvfU
c76bcie+zkIS1thpsww=
=6DDn
-----END PGP PUBLIC KEY BLOCK-----
`;
