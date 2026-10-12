#!/usr/bin/env bash
# Fetch a pinned, checksum-verified upstream release. Run manually from the project root:
# bash scripts/install-photocraft-web.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="0.5.0"
ARCHIVE="photocraft-web-${VERSION}.zip"
SOURCE="https://github.com/storytold/photocraft/releases/download/v${VERSION}/${ARCHIVE}"
EXPECTED_SHA256="855da01e7ce518049c6f3a090f1218864f7b780811e340db409e5c3cef93cd6d"
DEST="${ROOT}/assets/artcraft/photocraft"

for command in curl unzip find; do
  command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 1; }
done
if ! command -v sha256sum >/dev/null && ! command -v shasum >/dev/null; then
  echo "sha256sum or shasum is required" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
echo "Downloading PhotoCraft ${VERSION}..."
curl --fail --location --retry 3 --silent --show-error "$SOURCE" -o "${TMP}/${ARCHIVE}"
if command -v sha256sum >/dev/null; then
  ACTUAL_SHA256="$(sha256sum "${TMP}/${ARCHIVE}" | cut -d ' ' -f 1)"
else
  ACTUAL_SHA256="$(shasum -a 256 "${TMP}/${ARCHIVE}" | cut -d ' ' -f 1)"
fi
if [[ "$ACTUAL_SHA256" != "$EXPECTED_SHA256" ]]; then
  echo "PhotoCraft ZIP SHA-256 did not match expected release. Refusing to install." >&2
  exit 1
fi
unzip -q "${TMP}/${ARCHIVE}" -d "${TMP}/unpacked"
SITE="${TMP}/unpacked/photocraft-web-${VERSION}"
if [[ ! -f "${SITE}/index.html" ]] || ! find "$SITE" -maxdepth 2 -name '*.wasm' | grep -q .; then
  echo "Release layout is unexpected (index.html or WASM missing). Refusing to install." >&2
  exit 1
fi

mkdir -p "${TMP}/ready/licenses"
cp -R "${SITE}/." "${TMP}/ready/"
for filename in LICENSE-APACHE LICENSE-MIT NOTICE ATTRIBUTION.md; do
  curl --fail --location --retry 3 --silent --show-error \
    "https://raw.githubusercontent.com/storytold/photocraft/v${VERSION}/${filename}" \
    -o "${TMP}/ready/licenses/${filename}"
done
mkdir -p "$(dirname "$DEST")"
# A completed bundle replaces only this dedicated, upstream-owned directory.
rm -rf "$DEST"
mv "${TMP}/ready" "$DEST"
echo "PhotoCraft installed at assets/artcraft/photocraft/."
echo "Open 그림 뚝딱.html from the site's HTTP(S) origin to launch the local editor."
echo "Review the changes before committing the large WASM binary."
