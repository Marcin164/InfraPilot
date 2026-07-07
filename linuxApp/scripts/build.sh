#!/bin/bash
# Build pipeline:
#   1. PyInstaller --onedir -> dist/infrapilot-agent (CLI) + dist/infrapilot-agent-gui (Tkinter GUI)
#   2. Assemble a .deb root under /opt/infrapilot/agent + a desktop entry
#   3. dpkg-deb --build -> installer/Output/InfraPilotAgentSetup-x.y.z-<arch>.deb
#   4. Detached GPG signature (see "Signing" below) -> same file + .sig
#
# Usage:
#   ./scripts/build.sh
#   ./scripts/build.sh --skip-installer   # stop after the PyInstaller bundles
#
# Signing:
#   Set SIGNING_KEY_ID to a GPG key already present in this machine's
#   keyring (never a private key file checked into this repo -- that key
#   must live on a separate, controlled signing machine/CI secret store,
#   never on the same host that serves the built .deb for download, or
#   the signature proves nothing). Without SIGNING_KEY_ID the build still
#   produces a usable .deb, just unsigned -- with a loud warning.
#   The matching public key lives at installer/infrapilot-packages-public.asc
#   (committed) and must be kept in sync with backend/src/config/packageSigningKey.ts,
#   which is what the install-time verification step actually trusts.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_INSTALLER=0
for arg in "$@"; do
  case "$arg" in
    --skip-installer) SKIP_INSTALLER=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

VERSION="$(python3 -c "import sys; sys.path.insert(0,'.'); from agent import __version__; print(__version__)")"
echo "Building InfraPilot Linux agent v${VERSION}"

case "$(uname -m)" in
  x86_64)  DEB_ARCH=amd64 ;;
  aarch64) DEB_ARCH=arm64 ;;
  armv7l)  DEB_ARCH=armhf ;;
  *) DEB_ARCH="$(dpkg --print-architecture 2>/dev/null || echo amd64)" ;;
esac

rm -rf build dist installer/Output installer/pkgroot
mkdir -p installer/Output

python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt pyinstaller

echo "==> Building infrapilot-agent (CLI)"
python3 -m PyInstaller --noconfirm --onedir --console \
  --name infrapilot-agent -p . agent/main.py

echo "==> Building infrapilot-agent-gui (Tkinter)"
python3 -m PyInstaller --noconfirm --onedir --windowed \
  --name infrapilot-agent-gui -p . agent/gui.py

if [ "$SKIP_INSTALLER" -eq 1 ]; then
  echo "Skipping installer (--skip-installer). Bundles are under dist/."
  exit 0
fi

echo "==> Assembling .deb root"
PKGROOT="installer/pkgroot"
rm -rf "$PKGROOT"
mkdir -p "$PKGROOT/opt/infrapilot/agent" "$PKGROOT/usr/bin" \
         "$PKGROOT/usr/share/applications" "$PKGROOT/DEBIAN"

cp -R "dist/infrapilot-agent/." "$PKGROOT/opt/infrapilot/agent/"
mkdir -p "$PKGROOT/opt/infrapilot/agent/gui"
cp -R "dist/infrapilot-agent-gui/." "$PKGROOT/opt/infrapilot/agent/gui/"

ln -sf /opt/infrapilot/agent/infrapilot-agent "$PKGROOT/usr/bin/infrapilot-agent"

cat > "$PKGROOT/usr/share/applications/infrapilot-agent.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=InfraPilot Agent
Comment=Status, connect and rescan for the InfraPilot inventory agent
Exec=/opt/infrapilot/agent/gui/infrapilot-agent-gui
Icon=utilities-system-monitor
Terminal=false
Categories=System;Settings;
EOF

INSTALLED_SIZE_KB="$(du -sk "$PKGROOT/opt" | cut -f1)"

sed \
  -e "s/^Version:.*/Version: ${VERSION}/" \
  -e "s/^Architecture:.*/Architecture: ${DEB_ARCH}/" \
  -e "s/^Installed-Size:.*/Installed-Size: ${INSTALLED_SIZE_KB}/" \
  installer/control.template > "$PKGROOT/DEBIAN/control"

cp installer/postinst "$PKGROOT/DEBIAN/postinst"
cp installer/prerm "$PKGROOT/DEBIAN/prerm"
chmod 0755 "$PKGROOT/DEBIAN/postinst" "$PKGROOT/DEBIAN/prerm"

echo "==> dpkg-deb --build"
OUT_DEB="installer/Output/InfraPilotAgentSetup-${VERSION}-${DEB_ARCH}.deb"
dpkg-deb --root-owner-group --build "$PKGROOT" "$OUT_DEB"

if [ -n "${SIGNING_KEY_ID:-}" ]; then
  echo "==> Signing with GPG key ${SIGNING_KEY_ID}"
  gpg --batch --yes --detach-sign --armor -u "$SIGNING_KEY_ID" \
      -o "${OUT_DEB}.sig" "$OUT_DEB"
  echo "  Signature: $ROOT/${OUT_DEB}.sig"
else
  echo ""
  echo "!! SIGNING_KEY_ID not set -- .deb built UNSIGNED. Set it (a key already"
  echo "!! in this machine's keyring, never a private key from this repo) to"
  echo "!! produce a signature the bootstrap script can verify before dpkg -i."
fi

echo ""
echo "Build complete."
echo "  Agent:     $ROOT/dist/infrapilot-agent/infrapilot-agent"
echo "  GUI:       $ROOT/dist/infrapilot-agent-gui/infrapilot-agent-gui"
echo "  Installer: $ROOT/$OUT_DEB"
