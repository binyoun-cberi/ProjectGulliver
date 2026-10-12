#!/usr/bin/env bash
# Install pinned, verified PdfCraft WebAssembly and the browser-only pdf-lib helper.
# Run in the root of ProjectGulliver. No source code is executed during download.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.7.1"
ARCHIVE="pdfcraft-web-${VERSION}.zip"
PDFCRAFT_URL="https://github.com/storytold/pdfcraft/releases/download/v${VERSION}/${ARCHIVE}"
PDFCRAFT_SHA256="2e58067125b2c14d92d50888a6a03351302065ff4b99c0914892a078f05dfd66"
PDFLIB_VERSION="1.17.1"
PDFLIB_TARBALL="pdf-lib-${PDFLIB_VERSION}.tgz"
PDFLIB_URL="https://registry.npmjs.org/pdf-lib/-/${PDFLIB_TARBALL}"
PDFLIB_SHA512_BASE64="V/mpyJAoTsN4cnP31vc0wfNA1+p20evqqnap0KLoRUN0Yk/p3wN52DOEsL4oBFcLdb76hlpKPtzJIgo67j/XLw=="
DIR_PDFCRAFT="$ROOT/assets/artcraft/pdfcraft"
DIR_PDFLIB="$ROOT/vendor/pdf-lib"

for c in curl unzip tar python3; do command -v "$c" >/dev/null || { echo "Missing dependency: $c" >&2; exit 1; }; done
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fL --retry 3 --silent --show-error "$PDFCRAFT_URL" -o "$TMP/$ARCHIVE"
curl -fL --retry 3 --silent --show-error "$PDFLIB_URL" -o "$TMP/$PDFLIB_TARBALL"
PDFCRAFT_ZIP="$TMP/$ARCHIVE" PDFLIB_PKG="$TMP/$PDFLIB_TARBALL" \
  PDFCRAFT_SHA256="$PDFCRAFT_SHA256" PDFLIB_SHA512_BASE64="$PDFLIB_SHA512_BASE64" python3 - <<'PY'
import os,hashlib,base64
from pathlib import Path
p=Path(os.environ['PDFCRAFT_ZIP'])
actual=hashlib.sha256(p.read_bytes()).hexdigest()
assert actual == os.environ['PDFCRAFT_SHA256'], f'Unexpected PdfCraft SHA-256: {actual}'
p=Path(os.environ['PDFLIB_PKG'])
actual=base64.b64encode(hashlib.sha512(p.read_bytes()).digest()).decode()
assert actual == os.environ['PDFLIB_SHA512_BASE64'], 'Unexpected pdf-lib SHA-512'
print('Release archives verified')
PY
unzip -q "$TMP/$ARCHIVE" -d "$TMP/unzip"
SITE="$TMP/unzip/pdfcraft-web-${VERSION}"
test -s "$SITE/index.html"
find "$SITE" -maxdepth 2 -name '*.wasm' -size +0c | grep -q . || { echo "PdfCraft WASM missing" >&2; exit 1; }
mkdir -p "$TMP/pdfcraft-ready/licenses" "$TMP/pdf-lib-ready"
cp -a "$SITE/." "$TMP/pdfcraft-ready/"
for filename in LICENSE-MIT LICENSE-APACHE NOTICE ATTRIBUTION.md; do
  curl -fL --retry 3 --silent --show-error \
    "https://raw.githubusercontent.com/storytold/pdfcraft/v${VERSION}/${filename}" \
    -o "$TMP/pdfcraft-ready/licenses/${filename}"
done
tar -xzf "$TMP/$PDFLIB_TARBALL" -C "$TMP"
test -s "$TMP/package/dist/pdf-lib.min.js"
test -s "$TMP/package/LICENSE.md"
cp "$TMP/package/dist/pdf-lib.min.js" "$TMP/pdf-lib-ready/pdf-lib.min.js"
cp "$TMP/package/LICENSE.md" "$TMP/pdf-lib-ready/LICENSE.md"
cat > "$TMP/pdfcraft-ready/gulliver-install.json" <<EOF
{
  "product": "PdfCraft",
  "source": "storytold/pdfcraft",
  "version": "${VERSION}",
  "release_sha256": "${PDFCRAFT_SHA256}"
}
EOF
cat > "$TMP/pdf-lib-ready/version.json" <<EOF
{
  "product": "pdf-lib",
  "version": "${PDFLIB_VERSION}",
  "source": "npm:pdf-lib",
  "integrity_sha512_base64": "${PDFLIB_SHA512_BASE64}"
}
EOF
# Protect hosts that reject individual assets over 25 MiB.
if find "$TMP/pdfcraft-ready" "$TMP/pdf-lib-ready" -type f -size +26214400c | grep -q .; then
  echo "File exceeds 25 MiB static hosting cap" >&2; exit 1
fi
mkdir -p "$(dirname "$DIR_PDFCRAFT")" "$(dirname "$DIR_PDFLIB")"
rm -rf "$DIR_PDFCRAFT" "$DIR_PDFLIB"
mv "$TMP/pdfcraft-ready" "$DIR_PDFCRAFT"
mv "$TMP/pdf-lib-ready" "$DIR_PDFLIB"
echo "Installed PdfCraft ${VERSION} and pdf-lib ${PDFLIB_VERSION} locally, including licenses."
