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
const PY_BACKEND_PORT: u16 = 8002;

// Holds every sidecar child process, not just one - as of the Python
// backend addition there are two (Node on BACKEND_PORT, Python on
// PY_BACKEND_PORT). Every early-exit path (failed spawn, failed health
// check, SIGTERM/SIGINT, RunEvent::Exit, panic) must kill everything in
// here, not just whichever one variable used to hold a single child -
// that's exactly the class of bug (a bare panic! orphaning a sidecar by
// unwinding out of setup() before cleanup ran) already fixed once for
// the Node-only version of this file.
struct SidecarProcesses(Mutex<Vec<CommandChild>>);

fn kill_sidecars(app_handle: &AppHandle) {
  let state = app_handle.state::<SidecarProcesses>();
  let mut children = state.0.lock().unwrap();
  for child in children.drain(..) {
    let _ = child.kill();
  }
}

fn register_sidecar(app_handle: &AppHandle, child: CommandChild) {
  app_handle.state::<SidecarProcesses>().0.lock().unwrap().push(child);
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

fn pump_sidecar_output(tag: &'static str, mut rx: tauri::async_runtime::Receiver<CommandEvent>) {
  tauri::async_runtime::spawn(async move {
    while let Some(event) = rx.recv().await {
      match event {
        CommandEvent::Stdout(line) => {
          log::info!("[{}] {}", tag, String::from_utf8_lossy(&line));
        }
        CommandEvent::Stderr(line) => {
          log::error!("[{}] {}", tag, String::from_utf8_lossy(&line));
        }
        _ => {}
      }
    }
  });
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
    .manage(SidecarProcesses(Mutex::new(Vec::new())))
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
        // Historical: the app identifier changed once before, from
        // com.woodbooster.os to wood-booster-os, and this block carried
        // that specific migration. It does NOT cover the later
        // wood-booster-os -> wood-booster-hq rename - that transition
        // had no data worth preserving, so no second migration branch
        // was added. This code is otherwise harmless to leave in place:
        // old_db_path just never exists anymore, and things fall
        // through to the seed-db copy below, which is correct anyway.
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

      let (node_rx, node_child) = match app
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
      {
        Ok(pair) => pair,
        Err(err) => {
          // Nothing was running yet at this point, but handled
          // explicitly (not a bare .expect()) for consistency with the
          // Python spawn below, where a bare .expect() here really
          // would orphan an already-running sidecar.
          kill_sidecars(&app.handle().clone());
          panic!("failed to spawn wood-booster-server sidecar: {}", err);
        }
      };

      register_sidecar(&app.handle().clone(), node_child);
      pump_sidecar_output("server", node_rx);

      // Python backend (Spacemonkey chat, the real desktop terminal,
      // virtual file storage, Git Guardian). Bundled as a standalone,
      // relocatable CPython interpreter (backend/scripts/prepare-sidecar.js)
      // rather than a single frozen executable (PyInstaller etc.) - the
      // same reasoning that ruled out `pkg` for the Node sidecar applies
      // here: freezing changes what a module's own __file__ resolves to,
      // and backend/modules/paths.py, git_guardian.py and
      // desktop_terminal.py all compute real filesystem locations from it.
      //
      // The bundled interpreter binary itself has no ldd dependency on a
      // separate libpython.so, but it still needs its own standard
      // library at runtime - PYTHONHOME points it at the bundled
      // resources/pybackend/python tree instead of searching relative to
      // its own (renamed, Tauri-sidecar-convention) filename.
      let pybackend_dir = resource_dir.join("resources").join("pybackend");
      let python_home = pybackend_dir.join("python");

      let py_data_dir = app_data_dir.join("python");
      std::fs::create_dir_all(&py_data_dir)?;

      let home_dir = std::env::var("HOME").unwrap_or_default();

      // Single-user app on Marc's own machine, not a general-purpose
      // installer - a fixed default here (overridable via env var, for
      // whoever eventually needs to) is a deliberate, confirmed choice,
      // not a placeholder. See docs/GIT_WORKFLOW.md for why this
      // specific path is the real, live checkout Git Guardian must act
      // on, never a copy.
      let git_root = std::env::var("WOOD_BOOSTER_GIT_ROOT")
        .unwrap_or_else(|_| format!("{}/Wood-Booster-AI/Wood-Booster-OS", home_dir));
      let vault_root = std::env::var("WOOD_BOOSTER_VAULT_ROOT")
        .unwrap_or_else(|_| format!("{}/Wood-Booster-AI", home_dir));

      log::info!("pybackend_dir: {}", pybackend_dir.display());
      log::info!("python_home: {}", python_home.display());
      log::info!("git_root: {}", git_root);
      log::info!("vault_root: {}", vault_root);

      let (python_rx, python_child) = match app
        .shell()
        .sidecar("wood-booster-python")?
        .current_dir(&pybackend_dir)
        .arg("-m")
        .arg("backend.main")
        .env("PYTHONHOME", python_home.to_string_lossy().to_string())
        .env("PORT", PY_BACKEND_PORT.to_string())
        .env(
          "WOOD_BOOSTER_PY_DATA_DIR",
          py_data_dir.to_string_lossy().to_string(),
        )
        .env("WOOD_BOOSTER_GIT_ROOT", &git_root)
        .env("WOOD_BOOSTER_VAULT_ROOT", &vault_root)
        .spawn()
      {
        Ok(pair) => pair,
        Err(err) => {
          // The Node sidecar is already running at this point - a bare
          // .expect() here would panic straight out of setup() and
          // orphan it. Kill everything registered so far before dying.
          kill_sidecars(&app.handle().clone());
          panic!("failed to spawn wood-booster-python sidecar: {}", err);
        }
      };

      register_sidecar(&app.handle().clone(), python_child);
      pump_sidecar_output("python", python_rx);

      // Both backends' health checks run in parallel, not one after the
      // other - wait_for_backend_ready can block up to 30s per port
      // worst case, so sequential checking would double the worst-case
      // startup wait for no reason.
      let node_ready_handle = std::thread::spawn(|| wait_for_backend_ready(BACKEND_PORT));
      let python_ready_handle = std::thread::spawn(|| wait_for_backend_ready(PY_BACKEND_PORT));

      let node_ready = node_ready_handle.join().unwrap_or(false);
      let python_ready = python_ready_handle.join().unwrap_or(false);

      if !node_ready || !python_ready {
        kill_sidecars(&app.handle().clone());
        panic!(
          "backend(s) did not become ready in time (server: {}, python: {})",
          node_ready, python_ready
        );
      }

      // The window's webview begins loading and firing the frontend's
      // initial API calls as soon as it's created, in parallel with
      // this setup() function - it doesn't wait for the backend to be
      // ready first. On a slow first run (seed-db copy, cold disk
      // cache) those calls hit the backend before it's listening and
      // fail with no retry, so every page looks permanently empty even
      // once the backend comes up seconds later.
      //
      // Tried hiding the window (visible: false) until here and
      // showing it only now - that made Tauri treat the app as having
      // zero open windows at startup and exit immediately, which is
      // worse than the bug it was meant to fix. Settled for a forced
      // reload instead: the window still appears right away, but its
      // content refreshes once the backend is confirmed healthy,
      // trading a brief visible reload flash for actually working.
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.eval("window.location.reload()");
      }

      // Windowless shutdown (SIGTERM/SIGINT: session logout, `kill`,
      // systemd stop) bypasses RunEvent::Exit, which only fires on a
      // window-driven exit. Without this, the sidecars orphan. Signal
      // registration itself must never take the whole app down if the
      // platform refuses it - that would trade a rare orphan process
      // for a guaranteed broken launch.
      match Signals::new([SIGTERM, SIGINT]) {
        Ok(mut signals) => {
          let signal_app_handle = app.handle().clone();
          std::thread::spawn(move || {
            if signals.forever().next().is_some() {
              kill_sidecars(&signal_app_handle);
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
        kill_sidecars(app_handle);
      }
    });
}
