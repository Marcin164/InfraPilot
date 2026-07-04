#!/bin/bash
# Build pipeline:
#   1. PyInstaller --onedir -> dist/infrapilot-agent (CLI) + dist/infrapilot-agent-gui (Tkinter GUI)
#   2. Assemble a .deb root under /opt/infrapilot/agent + a desktop entry
#   3. dpkg-deb --build -> installer/Output/InfraPilotAgentSetup-x.y.z-<arch>.deb
#
# No signing step (unlike the macOS pipeline's codesign/notarize) --
# .deb has no equivalent of Gatekeeper; distros that want provenance
# verify via apt's repo signing instead, which is a packaging-repo
# concern, not something a standalone .deb build can do on its own.
#
# Usage:
#   ./scripts/build.sh
#   ./scripts/build.sh --skip-installer   # stop after the PyInstaller bundles

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

echo ""
echo "Build complete."
echo "  Agent:     $ROOT/dist/infrapilot-agent/infrapilot-agent"
echo "  GUI:       $ROOT/dist/infrapilot-agent-gui/infrapilot-agent-gui"
echo "  Installer: $ROOT/$OUT_DEB"
