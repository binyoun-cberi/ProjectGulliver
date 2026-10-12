#!/usr/bin/env bash
# Install an upstream, checksum-verified VectorCraft static web release.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.10.0"
ARCHIVE="vectorcraft-web-${VERSION}.zip"
URL="https://github.com/storytold/vectorcraft/releases/download/v${VERSION}/${ARCHIVE}"
EXPECTED="aaf1136d4e76606085294942563207111ab7f57cbe6d5f97f03573fa14d37968"
DEST="$ROOT/assets/artcraft/vectorcraft"
for binary in curl unzip python3; do command -v "$binary" >/dev/null || { echo "$binary is required" >&2; exit 1; }; done
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl --fail --location --retry 3 --silent --show-error "$URL" -o "$TMP/$ARCHIVE"
ARCHIVE_PATH="$TMP/$ARCHIVE" EXPECTED_SHA256="$EXPECTED" python3 - <<'PY'
from pathlib import Path
import os,hashlib
data=Path(os.environ['ARCHIVE_PATH']).read_bytes()
assert hashlib.sha256(data).hexdigest()==os.environ['EXPECTED_SHA256'], 'VectorCraft checksum did not match; refusing installation'
print('VectorCraft release ZIP checksum verified')
PY
unzip -q "$TMP/$ARCHIVE" -d "$TMP/unpacked"
SITE="$TMP/unpacked/vectorcraft-web-${VERSION}"
test -s "$SITE/index.html"
find "$SITE" -maxdepth 1 -name '*.wasm' -size +0c | grep -q . || { echo "WASM missing" >&2; exit 1; }
mkdir -p "$TMP/ready/licenses"
cp -a "$SITE/." "$TMP/ready/"
for file in LICENSE-MIT LICENSE-APACHE NOTICE; do
  curl --fail --location --retry 3 --silent --show-error \
    "https://raw.githubusercontent.com/storytold/vectorcraft/v${VERSION}/${file}" \
    -o "$TMP/ready/licenses/${file}"
done
cat > "$TMP/ready/gulliver-install.json" <<EOF
{
  "product": "VectorCraft",
  "source": "storytold/vectorcraft",
  "version": "${VERSION}",
  "release_sha256": "${EXPECTED}"
}
EOF
# GitHub rejects blobs >= 100MB. Guard with 90MiB buffer; GitHub Pages is the target.
if find "$TMP/ready" -type f -size +94371840c | grep -q .; then
  echo "Upstream asset exceeds GitHub static source file limit" >&2
  exit 1
fi
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mv "$TMP/ready" "$DEST"
echo "Installed upstream VectorCraft ${VERSION} WebAssembly with original licenses."
