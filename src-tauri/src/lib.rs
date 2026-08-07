use std::io::{Read, Write};
use std::net::TcpStream;
use std::sync::Mutex;
use std::time::Duration;

use signal_hook::consts::{SIGINT, SIGTERM};
use signal_hook::iterator::Signals;
use tauri::{AppHandle, Manager, RunEvent};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

const BACKEND_PORT: u16 = 3001;

struct SidecarProcess(Mutex<Option<CommandChild>>);

fn kill_sidecar(app_handle: &AppHandle) {
  if let Some(child) = app_handle.state::<SidecarProcess>().0.lock().unwrap().take() {
    let _ = child.kill();
  }
}

fn wait_for_backend_ready(port: u16) -> bool {
  let request =
    "GET /api/health HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n";

  for _ in 0..60 {
    if let Ok(mut stream) = TcpStream::connect(("127.0.0.1", port)) {
      if stream.write_all(request.as_bytes()).is_ok() {
        let mut response = String::new();
        if stream.read_to_string(&mut response).is_ok()
          && response.starts_with("HTTP/1.1 200")
        {
          return true;
        }
      }
    }
    std::thread::sleep(Duration::from_millis(500));
  }

  false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // WebKitGTK 2.52.5's DMA-BUF renderer crashes under this system's
  // Wayland/KWin setup ("Protocol error 71 dispatching to Wayland
  // display", then repeated internal WebKit errors, taking the whole
  // process down after the window has already rendered once). This
  // must be set before the first webview is created, and must not
  // depend on the launcher setting an env var - a desktop icon / app
  // menu launch never would. Set unconditionally on Linux; harmless
  // if the underlying bug doesn't apply to a given machine.
  #[cfg(target_os = "linux")]
  std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .manage(SidecarProcess(Mutex::new(None)))
    .setup(|app| {
      // Logging stays on in release too: this is the only window into
      // sidecar startup failures once the app is out of dev mode, and
      // Marc can hand us a log file instead of a screen-share.
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
      )?;

      let app_data_dir = app.path().app_data_dir()?;
      std::fs::create_dir_all(&app_data_dir)?;

      let db_path = app_data_dir.join("dev.db");
      let resource_dir = app.path().resource_dir()?;
      let server_dir = resource_dir.join("resources").join("server");

      log::info!("app_data_dir: {}", app_data_dir.display());
      log::info!("resource_dir: {}", resource_dir.display());
      log::info!("server_dir: {}", server_dir.display());
      log::info!("server_dir exists: {}", server_dir.exists());
      log::info!("index.js exists: {}", server_dir.join("index.js").exists());

      if !db_path.exists() {
        // The app identifier changed from com.woodbooster.os to
        // wood-booster-os during development, which moves where this
        // resolves to. Anyone who already used the app under the old
        // identifier gets their database carried over here instead of
        // silently starting over from the empty seed.
        let old_db_path = app_data_dir
          .parent()
          .map(|parent| parent.join("com.woodbooster.os").join("dev.db"))
          .filter(|path| path.exists());

        match old_db_path {
          Some(old_path) => {
            log::info!("migrating database from old identifier: {}", old_path.display());
            std::fs::copy(&old_path, &db_path)?;
          }
          None => {
            let seed_db_path = server_dir.join("seed").join("wood-booster-seed.db");
            log::info!("copying seed db from: {}", seed_db_path.display());
            std::fs::copy(&seed_db_path, &db_path)?;
          }
        }
      }

      let database_url = format!("file:{}", db_path.display());

      let (mut rx, child) = app
        .shell()
        .sidecar("wood-booster-server")?
        .current_dir(server_dir)
        .arg("index.js")
        .env("DATABASE_URL", database_url)
        .env("PORT", BACKEND_PORT.to_string())
        .env(
          "WOOD_BOOSTER_DATA_DIR",
          app_data_dir.to_string_lossy().to_string(),
        )
        .spawn()
        .expect("failed to spawn wood-booster-server sidecar");

      *app.state::<SidecarProcess>().0.lock().unwrap() = Some(child);

      tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
          match event {
            CommandEvent::Stdout(line) => {
              log::info!("[server] {}", String::from_utf8_lossy(&line));
            }
            CommandEvent::Stderr(line) => {
              log::error!("[server] {}", String::from_utf8_lossy(&line));
            }
            _ => {}
          }
        }
      });

      if !wait_for_backend_ready(BACKEND_PORT) {
        // A plain panic! here would unwind straight out of setup()
        // before RunEvent::Exit or the signal handler below ever get a
        // chance to run, orphaning the sidecar. Kill it ourselves first.
        kill_sidecar(&app.handle().clone());
        panic!("wood-booster-server did not become ready in time");
      }

      // Windowless shutdown (SIGTERM/SIGINT: session logout, `kill`,
      // systemd stop) bypasses RunEvent::Exit, which only fires on a
      // window-driven exit. Without this, the sidecar orphans. Signal
      // registration itself must never take the whole app down if the
      // platform refuses it - that would trade a rare orphan process
      // for a guaranteed broken launch.
      match Signals::new([SIGTERM, SIGINT]) {
        Ok(mut signals) => {
          let signal_app_handle = app.handle().clone();
          std::thread::spawn(move || {
            if signals.forever().next().is_some() {
              kill_sidecar(&signal_app_handle);
              std::process::exit(0);
            }
          });
        }
        Err(err) => {
          log::warn!("could not register shutdown signal handler: {}", err);
        }
      }

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|app_handle, event| {
      if let RunEvent::Exit = event {
        kill_sidecar(app_handle);
      }
    });
}
