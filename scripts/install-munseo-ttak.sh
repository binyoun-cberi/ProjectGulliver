#!/usr/bin/env bash
# Download a SHA256-pinned WordCraft web bundle and an exact npm version of docx.
# Never run untrusted packages' lifecycle scripts. Only distribute static assets.
set -euo pipefail
trap 'echo "Document tools install failed at line $LINENO: $BASH_COMMAND" >&2' ERR
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.6.1"
ARCHIVE="wordcraft-web-${VERSION}.zip"
URL="https://github.com/storytold/wordcraft/releases/download/v${VERSION}/${ARCHIVE}"
EXPECTED="85e458cb5adaa75afa871a9858c735ef7fd1e05741c6bf5d444dc09a1eb29e0a"
DOCX_VERSION="9.10.0"
DEST="$ROOT/assets/artcraft/wordcraft"
LIB="$ROOT/vendor/docx"
for cmd in curl python3 unzip npm tar; do command -v "$cmd" >/dev/null || { echo "Missing command $cmd" >&2; exit 1; }; done
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
curl -fLsS --retry 3 "$URL" -o "$TMP/$ARCHIVE"
ARCHIVE_FILE="$TMP/$ARCHIVE" EXPECTED_DIGEST="$EXPECTED" python3 - <<'PY'
from pathlib import Path
import os,hashlib
file=Path(os.environ['ARCHIVE_FILE'])
actual=hashlib.sha256(file.read_bytes()).hexdigest()
assert actual==os.environ['EXPECTED_DIGEST'], 'Official WordCraft ZIP did not match SHA-256'
print('Verified WordCraft ZIP',actual)
PY
unzip -q "$TMP/$ARCHIVE" -d "$TMP/upstream"
SOURCE="$TMP/upstream/wordcraft-web-${VERSION}"
echo "Checking WordCraft archive layout:"
find "$TMP/upstream" -maxdepth 3 -type f | head -n 18
 test -s "$SOURCE/index.html"
find "$SOURCE" -maxdepth 1 -name '*.wasm' -size +0c | grep -q . || { echo "WordCraft WebAssembly file missing" >&2; exit 1; }
echo "WordCraft page and WASM validated."
mkdir -p "$TMP/wordcraft-ready/licenses" "$TMP/docx-ready" "$TMP/npm"
cp -a "$SOURCE/." "$TMP/wordcraft-ready/"
for name in LICENSE-MIT LICENSE-APACHE NOTICE ATTRIBUTION.md; do
  curl -fLsS --retry 3 "https://raw.githubusercontent.com/storytold/wordcraft/v${VERSION}/${name}" \
    -o "$TMP/wordcraft-ready/licenses/${name}"
done
# Registry's strong package-integrity metadata is checked by npm during pack.
# --ignore-scripts keeps the dependency's install hooks from running.
(cd "$TMP/npm" && npm pack "docx@${DOCX_VERSION}" --ignore-scripts --silent --pack-destination "$TMP/npm" >/dev/null)
TARBALL="$TMP/npm/docx-${DOCX_VERSION}.tgz"
test -s "$TARBALL"
tar -xzf "$TARBALL" -C "$TMP/npm"
test -s "$TMP/npm/package/dist/index.iife.min.js"
test -s "$TMP/npm/package/dist/index.umd.cjs"
test -s "$TMP/npm/package/LICENSE"
cp "$TMP/npm/package/dist/index.iife.min.js" "$TMP/docx-ready/docx.iife.min.js"
cp "$TMP/npm/package/dist/index.umd.cjs" "$TMP/docx-ready/docx.umd.cjs"
cp "$TMP/npm/package/LICENSE" "$TMP/docx-ready/LICENSE"
DOCX_PACKAGE="$TMP/npm/package/package.json" DOCX_TARBALL="$TARBALL" python3 - <<'PY'
import json,hashlib,os
from pathlib import Path
p=json.loads(Path(os.environ['DOCX_PACKAGE']).read_text())
assert p['name']=='docx' and p['version']=='9.10.0' and p['license']=='MIT'
actual=hashlib.sha512(Path(os.environ['DOCX_TARBALL']).read_bytes()).hexdigest()
Path(os.environ['DOCX_TARBALL']+'.sha512').write_text(actual+'\n')
print('Installed verified npm registry release: docx 9.10.0 (sha512 '+actual[:18]+'...)')
PY
DOCX_TARBALL="$TARBALL" python3 - <<'PY' > "$TMP/docx-ready/version.json"
import json,hashlib,os
from pathlib import Path
print(json.dumps({
 'product':'docx','source':'npm:docx','version':'9.10.0',
 'package_sha512':hashlib.sha512(Path(os.environ['DOCX_TARBALL']).read_bytes()).hexdigest()
},indent=2))
PY
cat > "$TMP/wordcraft-ready/gulliver-install.json" <<EOF
{
 "product": "WordCraft",
 "source": "storytold/wordcraft",
 "version": "${VERSION}",
 "release_sha256": "${EXPECTED}"
}
EOF
# Keep GitHub Pages' Git blob source files far below GitHub's 100MB hard ceiling.
if find "$TMP/wordcraft-ready" "$TMP/docx-ready" -type f -size +94371840c | grep -q .; then
  echo "Oversized static asset for GitHub Pages" >&2;exit 1
fi
mkdir -p "$(dirname "$DEST")" "$(dirname "$LIB")"
rm -rf "$DEST" "$LIB"
mv "$TMP/wordcraft-ready" "$DEST"
mv "$TMP/docx-ready" "$LIB"
echo "WordCraft ${VERSION} and browser docx ${DOCX_VERSION} installed from verified official sources."
