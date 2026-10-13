#!/usr/bin/env bash
# Vendor an exact, integrity-checked browser HWPX writer (MIT).
# Hancom's official C++ OWPML reference is documentation, not a JS runtime.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PKG="@ssabrojs/hwpxjs"
VERSION="0.4.0"
DEST="$ROOT/vendor/hwpxjs"
for cmd in npm node python3 tar; do command -v "$cmd" >/dev/null || { echo "Missing $cmd" >&2; exit 1; }; done
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
(
  cd "$TMP"
  npm pack "$PKG@$VERSION" --ignore-scripts --json --silent > pack.json
)
TARBALL="$(node -p "require('$TMP/pack.json')[0].filename")"
PKG_ARCHIVE="$TMP/$TARBALL"
test -s "$PKG_ARCHIVE"
PKG_ARCHIVE="$PKG_ARCHIVE" PACK_JSON="$TMP/pack.json" python3 - <<'PY'
import json,hashlib,base64,os
from pathlib import Path
details=json.loads(Path(os.environ['PACK_JSON']).read_text())[0]
expected=details.get('integrity','')
digest=base64.b64encode(hashlib.sha512(Path(os.environ['PKG_ARCHIVE']).read_bytes()).digest()).decode()
assert expected == 'sha512-'+digest, 'Published npm package integrity mismatch'
assert details['name']=='@ssabrojs/hwpxjs' and details['version']=='0.4.0'
print('Verified HWPX writer 0.4.0 npm SHA-512 integrity:',expected[:38]+'...')
PY
tar -xzf "$PKG_ARCHIVE" -C "$TMP"
test -s "$TMP/package/dist/browser/hwpxjs.browser.mjs"
test -s "$TMP/package/LICENSE"
node --check "$TMP/package/dist/browser/hwpxjs.browser.mjs"
mkdir -p "$TMP/ready"
cp "$TMP/package/dist/browser/hwpxjs.browser.mjs" "$TMP/ready/hwpxjs.browser.mjs"
cp "$TMP/package/LICENSE" "$TMP/ready/LICENSE"
PKG_ARCHIVE="$PKG_ARCHIVE" python3 - <<'PY' > "$TMP/ready/version.json"
import hashlib,json,os
from pathlib import Path
p=Path(os.environ['PKG_ARCHIVE'])
print(json.dumps({
 'name':'@ssabrojs/hwpxjs',
 'version':'0.4.0',
 'license':'MIT',
 'source':'https://github.com/ssabro/hwpxjs',
 'package_sha512':hashlib.sha512(p.read_bytes()).hexdigest()
},ensure_ascii=False,indent=2))
PY
if find "$TMP/ready" -type f -size +26214400c | grep -q .; then
  echo "Unexpectedly large HWPX writer browser asset" >&2; exit 1
fi
mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mv "$TMP/ready" "$DEST"
echo "Installed validated MIT HWPX writer in $DEST"
