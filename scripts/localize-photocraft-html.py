#!/usr/bin/env python3
"""Set Korean as the first-run default of a built PhotoCraft WASM web bundle.

Preferences belong to PhotoCraft and remain editable in Edit > Preferences.
Only missing or Auto language is changed; explicit user choices are preserved.
No brittle search/replace of canvas or compiled WASM strings.
"""
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("Usage: localize-photocraft-html.py <web-dist-dir>")
root = Path(sys.argv[1])
page = root / "index.html"
s = page.read_text(encoding="utf-8")
if s.count("<head>") != 1:
    raise SystemExit("Unexpected upstream web HTML; refusing localization")
if "gulliver-korean-first-run" in s:
    raise SystemExit("Already localized; refusing double injection")
default = """<script id="gulliver-korean-first-run">
/* PhotoCraft includes its own Korean catalog. Use ko on the web by default
   without touching explicit English/other-language preferences. */
(() => {
  document.documentElement.lang = "ko";
  try {
    const key = "photocraft.preferences";
    const saved = window.localStorage.getItem(key);
    const prefs = saved ? JSON.parse(saved) : {};
    if (!prefs || typeof prefs !== "object" || Array.isArray(prefs)) return;
    if (!prefs.interface || typeof prefs.interface !== "object" || Array.isArray(prefs.interface)) {
      prefs.interface = {};
    }
    const lang = prefs.interface.language;
    if (lang == null || String(lang).trim().toLowerCase() === "auto") {
      prefs.interface.language = "ko";
      window.localStorage.setItem(key, JSON.stringify(prefs));
    }
  } catch (err) {
    console.warn("PhotoCraft Korean default could not be saved", err);
  }
})();
</script>
"""
s = s.replace('<html lang="en">', '<html lang="ko">', 1)
s = s.replace("<head>", "<head>\n" + default, 1)
s = s.replace("Loading PhotoCraft&hellip;", "PhotoCraft 한글판 불러오는 중…")
s = s.replace(
    "This is taking longer than usual. If PhotoCraft doesn't start, its files may have failed to\n      download or come from a different version of this page.",
    "불러오기가 오래 걸리고 있어요. 파일 다운로드에 실패했거나 버전이 일치하지 않을 수 있어요."
)
s = s.replace('>Reload</a> to try again; the browser\n      console lists what failed.', '>새로고침</a>하여 다시 시도해 주세요.')
page.write_text(s, encoding="utf-8")
print("PhotoCraft first-run language now defaults to Korean (explicit choices preserved).")
