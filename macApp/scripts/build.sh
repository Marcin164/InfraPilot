#!/bin/bash
# Build pipeline:
#   1. PyInstaller --onedir -> dist/infrapilot-agent (CLI) + dist/InfraPilot Agent.app (GUI)
#   2. codesign every binary (hardened runtime, Developer ID Application)
#   3. pkgbuild -> component.pkg, productbuild -> installer/Output/InfraPilotAgentSetup-x.y.z.pkg
#   4. productsign (Developer ID Installer) + notarytool submit --wait + stapler staple
#
# Requires (unless --skip-sign): a Developer ID Application cert and a
# Developer ID Installer cert in the login keychain, plus a notarytool
# keychain profile created once via:
#   xcrun notarytool store-credentials <profile> --apple-id ... --team-id ... --password ...
#
# Usage:
#   APPLE_DEVELOPER_ID_APPLICATION="Developer ID Application: Your Org (TEAMID)" \
#   APPLE_DEVELOPER_ID_INSTALLER="Developer ID Installer: Your Org (TEAMID)" \
#   APPLE_NOTARY_PROFILE=infrapilot-notary \
#   ./scripts/build.sh
#
#   ./scripts/build.sh --skip-sign       # local iteration, unsigned .app/.pkg only
#   ./scripts/build.sh --skip-installer  # stop after the PyInstaller bundles

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SKIP_SIGN=0
SKIP_INSTALLER=0
for arg in "$@"; do
  case "$arg" in
    --skip-sign) SKIP_SIGN=1 ;;
    --skip-installer) SKIP_INSTALLER=1 ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

VERSION="$(python3 -c "import sys; sys.path.insert(0,'.'); from agent import __version__; print(__version__)")"
echo "Building InfraPilot macOS agent v${VERSION}"

rm -rf build dist installer/Output component.pkg
mkdir -p installer/Output

python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt pyinstaller

echo "==> Building infrapilot-agent (CLI)"
python3 -m PyInstaller --noconfirm --onedir --console \
  --name infrapilot-agent -p . agent/main.py

echo "==> Building InfraPilot Agent.app (GUI)"
python3 -m PyInstaller --noconfirm --onedir --windowed \
  --name "InfraPilot Agent" -p . agent/gui.py

if [ "$SKIP_SIGN" -eq 0 ]; then
  : "${APPLE_DEVELOPER_ID_APPLICATION:?Set APPLE_DEVELOPER_ID_APPLICATION or pass --skip-sign}"
  echo "==> Codesigning (hardened runtime)"
  find "dist/infrapilot-agent" -type f \( -perm -u+x -o -name "*.so" -o -name "*.dylib" \) -print0 \
    | xargs -0 -I{} codesign --force --options runtime --timestamp \
        --sign "$APPLE_DEVELOPER_ID_APPLICATION" "{}"
  find "dist/InfraPilot Agent.app" -type f \( -perm -u+x -o -name "*.so" -o -name "*.dylib" \) -print0 \
    | xargs -0 -I{} codesign --force --options runtime --timestamp \
        --sign "$APPLE_DEVELOPER_ID_APPLICATION" "{}"
  codesign --force --options runtime --timestamp \
    --sign "$APPLE_DEVELOPER_ID_APPLICATION" "dist/InfraPilot Agent.app"
  codesign --force --options runtime --timestamp \
    --sign "$APPLE_DEVELOPER_ID_APPLICATION" "dist/infrapilot-agent/infrapilot-agent"
fi

if [ "$SKIP_INSTALLER" -eq 1 ]; then
  echo "Skipping installer (--skip-installer). Bundles are under dist/."
  exit 0
fi

echo "==> Assembling pkg root"
PKGROOT="$(mktemp -d)"
trap 'rm -rf "$PKGROOT"' EXIT

AGENT_DEST="$PKGROOT/Library/Application Support/InfraPilot/agent"
mkdir -p "$AGENT_DEST"
cp -R "dist/infrapilot-agent/." "$AGENT_DEST/"
mkdir -p "$PKGROOT/Applications"
cp -R "dist/InfraPilot Agent.app" "$PKGROOT/Applications/InfraPilot Agent.app"

echo "==> pkgbuild"
pkgbuild --root "$PKGROOT" \
  --scripts installer/scripts \
  --identifier com.infrapilot.agent \
  --version "$VERSION" \
  --install-location / \
  component.pkg

echo "==> productbuild"
sed "s/version=\"0.1.0\"/version=\"$VERSION\"/" installer/distribution.xml > "$PKGROOT/distribution.xml"
OUT_PKG="installer/Output/InfraPilotAgentSetup-${VERSION}.pkg"
productbuild --distribution "$PKGROOT/distribution.xml" --package-path . "$OUT_PKG"
rm -f component.pkg

if [ "$SKIP_SIGN" -eq 0 ]; then
  : "${APPLE_DEVELOPER_ID_INSTALLER:?Set APPLE_DEVELOPER_ID_INSTALLER or pass --skip-sign}"
  : "${APPLE_NOTARY_PROFILE:?Set APPLE_NOTARY_PROFILE or pass --skip-sign}"

  echo "==> productsign"
  SIGNED_PKG="installer/Output/InfraPilotAgentSetup-${VERSION}-signed.pkg"
  productsign --sign "$APPLE_DEVELOPER_ID_INSTALLER" "$OUT_PKG" "$SIGNED_PKG"
  mv -f "$SIGNED_PKG" "$OUT_PKG"

  echo "==> notarytool submit --wait"
  xcrun notarytool submit "$OUT_PKG" --keychain-profile "$APPLE_NOTARY_PROFILE" --wait

  echo "==> stapler staple"
  xcrun stapler staple "$OUT_PKG"
fi

echo ""
echo "Build complete."
echo "  Agent:     $ROOT/dist/infrapilot-agent/infrapilot-agent"
echo "  GUI:       $ROOT/dist/InfraPilot Agent.app"
echo "  Installer: $ROOT/$OUT_PKG"
