#!/usr/bin/env bash
# Download only pinned and verified official browser assets for 발표 뚝딱.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VER="0.6.1"
ZIP="deckcraft-web-${VER}.zip"
URL="https://github.com/storytold/deckcraft/releases/download/v${VER}/${ZIP}"
DIGEST="dd76659f643fa98ff79c86bf439bcaeeaaf6bd3a4037a1dc6628c97366862ba1"
PPTX_VER="v3.12.0"
PPTX_BLOB="1ff971b3a9684bf3d2592883f1832e6992043154"
PPTX_PATH="https://raw.githubusercontent.com/gitbrent/PptxGenJS/${PPTX_VER}"
DEST="$ROOT/assets/artcraft/deckcraft"
HELPER="$ROOT/vendor/pptxgenjs"
for cmd in curl python3 unzip git; do command -v "$cmd" >/dev/null || { echo "$cmd is required" >&2; exit 1; }; done
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl --fail --location --retry 3 --silent --show-error "$URL" -o "$TMP/$ZIP"
ZIPFILE="$TMP/$ZIP" EXPECTED="$DIGEST" python3 - <<'PY'
import hashlib,os
from pathlib import Path
p=Path(os.environ['ZIPFILE'])
digest=hashlib.sha256(p.read_bytes()).hexdigest()
assert digest==os.environ['EXPECTED'], 'DeckCraft release hash mismatch, install refused'
print('Verified official DeckCraft web release',digest)
PY
unzip -q "$TMP/$ZIP" -d "$TMP/source"
DIST="$TMP/source/deckcraft-web-${VER}"
test -s "$DIST/index.html"
find "$DIST" -maxdepth 1 -name '*.wasm' -size +0c | grep -q . || { echo "Missing DeckCraft WASM" >&2; exit 1; }
mkdir -p "$TMP/deck-ready/licenses" "$TMP/pptx-ready"
cp -a "$DIST/." "$TMP/deck-ready/"
for file in LICENSE-MIT LICENSE-APACHE NOTICE ATTRIBUTION.md; do
 curl --fail --location --retry 3 --silent --show-error \
  "https://raw.githubusercontent.com/storytold/deckcraft/v${VER}/${file}" \
  -o "$TMP/deck-ready/licenses/$file"
done
curl --fail --location --retry 3 --silent --show-error "$PPTX_PATH/dist/pptxgen.bundle.js" -o "$TMP/pptx-ready/pptxgen.bundle.js"
curl --fail --location --retry 3 --silent --show-error "$PPTX_PATH/LICENSE" -o "$TMP/pptx-ready/LICENSE"
ACTUAL_BLOB="$(git hash-object "$TMP/pptx-ready/pptxgen.bundle.js")"
if [[ "$ACTUAL_BLOB" != "$PPTX_BLOB" ]]; then
  echo "PptxGenJS bundled library Git blob hash mismatch, install refused" >&2; exit 1
fi
cat > "$TMP/deck-ready/gulliver-install.json" <<EOF
{
  "product": "DeckCraft",
  "source": "storytold/deckcraft",
  "version": "${VER}",
  "release_sha256": "${DIGEST}"
}
EOF
cat > "$TMP/pptx-ready/version.json" <<EOF
{
  "product": "PptxGenJS",
  "source": "gitbrent/PptxGenJS",
  "version": "3.12.0",
  "file_git_blob_sha1": "${PPTX_BLOB}"
}
EOF
if find "$TMP/deck-ready" "$TMP/pptx-ready" -type f -size +94371840c | grep -q .; then
 echo "File exceeds 90MiB GitHub Pages safe content limit" >&2;exit 1
fi
mkdir -p "$(dirname "$DEST")" "$(dirname "$HELPER")"
rm -rf "$DEST" "$HELPER"
mv "$TMP/deck-ready" "$DEST"
mv "$TMP/pptx-ready" "$HELPER"
echo "Installed verified DeckCraft ${VER} WASM and MIT PptxGenJS 3.12.0 library."
