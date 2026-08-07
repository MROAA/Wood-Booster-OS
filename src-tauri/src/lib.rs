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
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .manage(SidecarProcess(Mutex::new(None)))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      let app_data_dir = app.path().app_data_dir()?;
      std::fs::create_dir_all(&app_data_dir)?;

      let db_path = app_data_dir.join("dev.db");
      let resource_dir = app.path().resource_dir()?;
      let server_dir = resource_dir.join("resources").join("server");

      if !db_path.exists() {
        let seed_db_path = server_dir.join("seed").join("wood-booster-seed.db");
        std::fs::copy(&seed_db_path, &db_path)?;
      }

      let database_url = format!("file:{}", db_path.display());

      let (mut rx, child) = app
        .shell()
        .sidecar("wood-booster-server")?
        .current_dir(server_dir)
        .arg("index.js")
        .env("DATABASE_URL", database_url)
        .env("PORT", BACKEND_PORT.to_string())
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
        panic!("wood-booster-server did not become ready in time");
      }

      // Windowless shutdown (SIGTERM/SIGINT: session logout, `kill`,
      // systemd stop) bypasses RunEvent::Exit, which only fires on a
      // window-driven exit. Without this, the sidecar orphans.
      let signal_app_handle = app.handle().clone();
      let mut signals = Signals::new([SIGTERM, SIGINT])?;
      std::thread::spawn(move || {
        if signals.forever().next().is_some() {
          kill_sidecar(&signal_app_handle);
          std::process::exit(0);
        }
      });

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
