#!/usr/bin/env bash
# Add an OFL-1.1 licensed Korean UI/type font to a self-hosted PhotoCraft web build.
# Fonts are NOT embedded into the already-near-25MiB WASM file.
set -euo pipefail
[[ $# -eq 1 ]] || { echo "Usage: $0 <web-dist-dir>" >&2; exit 2; }
DEST="$1"
mkdir -p "$DEST/fonts/nanumgothic"
BASE="https://raw.githubusercontent.com/google/fonts/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/nanumgothic"
FONT="$DEST/fonts/nanumgothic/NanumGothic-Regular.ttf"
LICENSE="$DEST/fonts/nanumgothic/OFL.txt"
curl -fL --retry 3 --silent --show-error "$BASE/NanumGothic-Regular.ttf" -o "$FONT"
curl -fL --retry 3 --silent --show-error "$BASE/OFL.txt" -o "$LICENSE"
EXPECTED_FONT_BLOB="2aa2b20905b4136808a0126d8e36e5c0f576715c"
EXPECTED_LICENSE_BLOB="69ff40157d0bba4c65e4ecf77564e1f01d0b02a5"
[[ "$(git hash-object "$FONT")" == "$EXPECTED_FONT_BLOB" ]] || { echo "Korean font Git blob checksum mismatch" >&2; exit 1; }
[[ "$(git hash-object "$LICENSE")" == "$EXPECTED_LICENSE_BLOB" ]] || { echo "Korean font license checksum mismatch" >&2; exit 1; }
SHA256="$(sha256sum "$FONT" | cut -d' ' -f1)"
cat > "$DEST/fonts/manifest.txt" <<EOF
# Gulliver Korean UI / document text, Google Fonts Nanum Gothic (OFL-1.1).
Nanum Gothic | Regular | fonts/nanumgothic/NanumGothic-Regular.ttf | Kore,Latn | OFL-1.1 | fonts/nanumgothic/OFL.txt | ${SHA256} | https://github.com/google/fonts/tree/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/nanumgothic
EOF
echo "Verified Nanum Gothic Korean font and OFL license (${SHA256})."
