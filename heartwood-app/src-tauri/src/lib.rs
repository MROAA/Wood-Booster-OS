// Heartwood Trial is a pure client-side React app - no backend, no
// sidecars, so this is just the Tauri default template plus the one
// real fix carried over from Wood-Booster HQ's shell (see its lib.rs):
// WebKitGTK 2.52.5's DMA-BUF renderer crashes under this machine's
// Wayland/KWin setup unless disabled before the first webview is
// created. That's a Linux/WebKitGTK issue, not specific to the
// business app, so it applies here too.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  #[cfg(target_os = "linux")]
  std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running heartwood trial");
}
