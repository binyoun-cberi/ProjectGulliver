#!/usr/bin/env bash
# Pinned official ArtCraft FilmCraft & SoundCraft web distributions.
# Keep releases unmodified and alongside their open-source notices.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
for c in curl python3; do command -v "$c" >/dev/null || { echo "Missing $c" >&2;exit 1; }; done

install_one(){
  local product="$1" version="$2" hash="$3"
  local archive="${product}-web-${version}.zip"
  local url="https://github.com/storytold/${product}/releases/download/v${version}/${archive}"
  local folder="$TMP/$product" dest="$ROOT/assets/artcraft/$product"
  mkdir -p "$folder"
  curl --fail --location --retry 4 --retry-all-errors --show-error --silent "$url" -o "$folder/$archive"
  SOURCE="$folder/$archive" TARGET="$folder/ready" REPO="$product" VERSION="$version" EXPECTED="$hash" python3 - <<'PY'
import os,hashlib,zipfile,shutil,json
from pathlib import Path
src=Path(os.environ['SOURCE'])
data=src.read_bytes()
actual=hashlib.sha256(data).hexdigest()
assert actual==os.environ['EXPECTED'], f"Refusing ${os.environ['REPO']} ZIP: SHA-256 mismatch {actual}"
root=Path(os.environ['TARGET'])
root.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(src) as z:
    files=[i for i in z.infolist() if not i.is_dir()]
    assert len(files)<300, 'Unreasonably many archive entries'
    # Detect distribution root without assuming the publisher ZIP folder name.
    roots=[i.filename.rsplit('/',1)[0] for i in files if i.filename.endswith('/index.html')]
    if any(i.filename=='index.html' for i in files): roots.append('')
    choices=[]
    for rel in roots:
        prefix=(rel+'/' if rel else '')
        content=[i.filename[len(prefix):] for i in files if i.filename.startswith(prefix)]
        if any(n.endswith('.wasm') for n in content) and any(n.endswith('.js') for n in content):
            choices.append(rel)
    assert choices, f"Official ${os.environ['REPO']} web distribution has no HTML/JS/WASM entry point"
    rel=min(choices,key=len)
    prefix=rel+'/' if rel else ''
    seen=set()
    for info in files:
        if not info.filename.startswith(prefix):continue
        name=info.filename[len(prefix):]
        target=Path(name)
        if not name or target.is_absolute() or '..' in target.parts or '\\' in name:raise ValueError('Unsafe archive path: '+name)
        # Some source ZIPs contain installer helper or OS files: copy as-is.
        assert name not in seen, 'Duplicate archive file: '+name
        seen.add(name)
        assert info.file_size<90*1024*1024, 'Single source file exceeds GitHub Pages safe blob bound'
        assert info.file_size<150*1024*1024, 'Unreasonably large expanded file'
        dest=root/target
        dest.parent.mkdir(parents=True,exist_ok=True)
        with z.open(info) as r,dest.open('wb') as w:shutil.copyfileobj(r,w)
assert (root/'index.html').is_file(), 'index.html missing'
assert list(root.rglob('*.wasm')), 'WebAssembly missing'
assert list(root.rglob('*.js')), 'JavaScript glue missing'
(root/'gulliver-install.json').write_text(json.dumps({
 'product':os.environ['REPO'],'source':'storytold/'+os.environ['REPO'],
 'version':os.environ['VERSION'],'release_sha256':actual,
 'upstream_index':'index.html','distribution':'unchanged release files'
},ensure_ascii=False,indent=2)+'\n')
print(os.environ['REPO'],os.environ['VERSION'],actual,
      'static files:',len(list(root.rglob('*'))),
      'wasm bytes:',sum(p.stat().st_size for p in root.rglob('*.wasm')))
PY
  mkdir -p "$folder/ready/licenses"
  for lic in LICENSE-MIT LICENSE-APACHE NOTICE ATTRIBUTION.md; do
    curl --fail --location --retry 4 --silent --show-error \
      "https://raw.githubusercontent.com/storytold/$product/v$version/$lic" \
      -o "$folder/ready/licenses/$lic"
    test -s "$folder/ready/licenses/$lic"
  done
  # Bundled vendor app stays original and under ArtCraft trademark permission.
  # No upstream brand assets are reused as Gulliver marks.
  test -s "$folder/ready/index.html"
  mkdir -p "$(dirname "$dest")"
  rm -rf "$dest"
  mv "$folder/ready" "$dest"
}
install_one filmcraft 0.7.2 48d4f48728fa6b5c028612a4b7f59a5832ff38d430c6a7bd417a2c77d75ae4f9
install_one soundcraft 0.6.1 de78ec829b8c876bef748a792ba97a82aa37abdb0cd687156a7753220c6a1bef
echo "Installed official FilmCraft 0.7.2 & SoundCraft 0.6.1 web builds with licenses."
