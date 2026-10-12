#!/usr/bin/env python3
"""Apply Gulliver's Korean egui UI font support to pinned PhotoCraft v0.7.0 source.

PhotoCraft already ships a full ko translation catalog. The upstream web build,
however, has no OS CJK font fallback. This tiny source patch lets the web shell
fetch a self-hosted OFL Korean font and registers it as the UI's last-resort face.
It does not modify any original translations, tools, or document rendering.
"""
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("Usage: patch-photocraft-ko.py <photocraft-source-dir>")
src = Path(sys.argv[1]) / "apps/photocraft-web/src/web.rs"
text = src.read_text(encoding="utf-8")

def swap(before: str, after: str) -> None:
    global text
    number = text.count(before)
    if number != 1:
        raise SystemExit(f"Expected one upstream anchor (got {number}): {before[:100]!r}")
    text = text.replace(before, after)

swap(
    "                    load_font_manifest(served.clone(), cc.egui_ctx.clone());",
    """                    load_font_manifest(served.clone(), cc.egui_ctx.clone());
                    // On the web there are no OS Korean font faces. Load the
                    // self-hosted, OFL-licensed fallback only once per session.
                    let korean_ui_font: Arc<Mutex<Option<Vec<u8>>>> = Arc::default();
                    let target = korean_ui_font.clone();
                    let repaint = cc.egui_ctx.clone();
                    wasm_bindgen_futures::spawn_local(async move {
                        match fetch_bytes("fonts/nanumgothic/NanumGothic-Regular.ttf", None).await {
                            Ok(bytes) => {
                                *target.lock().unwrap_or_else(|e| e.into_inner()) = Some(bytes);
                                repaint.request_repaint();
                            }
                            Err(e) => log::warn!("Gulliver Korean UI font unavailable: {e}"),
                        }
                    });"""
)
swap(
    "Ok(Box::new(WebShell { app, inbox, unsaved, served, database, presets }))",
    "Ok(Box::new(WebShell { app, inbox, unsaved, served, database, presets, korean_ui_font }))"
)
swap(
    "    presets: crate::preset_bridge::Bridge,\n}",
    "    presets: crate::preset_bridge::Bridge,\n    korean_ui_font: Arc<Mutex<Option<Vec<u8>>>>,\n}"
)
swap(
    "impl WebShell {\n    fn save_presets(&mut self, ctx: &egui::Context) {",
    """impl WebShell {
    /// Korean catalog labels are drawn by egui, not HTML/CSS. Register a
    /// browser-fetched Hangul face after the app's theme/language font reset.
    fn ensure_korean_ui_font(&mut self, ctx: &egui::Context) {
        use egui::epaint::text::{FontInsert, FontPriority, InsertFontFamily};
        if photocraft_ui_egui::i18n::Lang::from_pref(&self.app.session.prefs().interface.language).code() != "ko" {
            return;
        }
        let name = "gulliver-nanumgothic";
        if ctx.fonts(|fonts| fonts.definitions().font_data.contains_key(name)) {
            return;
        }
        let font = self.korean_ui_font.lock().unwrap_or_else(|e| e.into_inner()).clone();
        let Some(font) = font else { return };
        let families = ctx.fonts(|fonts| {
            fonts.definitions().families.keys().cloned()
                .map(|family| InsertFontFamily { family, priority: FontPriority::Lowest })
                .collect()
        });
        ctx.add_font(FontInsert { name: name.into(), data: egui::FontData::from_owned(font), families });
        ctx.request_repaint();
    }

    fn save_presets(&mut self, ctx: &egui::Context) {"""
)
swap(
    "        self.app.logic(ctx, frame);\n        self.save_presets(ctx);",
    "        self.app.logic(ctx, frame);\n        self.ensure_korean_ui_font(ctx);\n        self.save_presets(ctx);"
)
src.write_text(text, encoding="utf-8")
print("Patched pinned PhotoCraft web Rust shell to serve Korean UI font.")
