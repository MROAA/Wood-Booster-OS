import { useEffect, useState } from 'react';
import WindowFrame from '../components/desktop/WindowFrame.jsx';
import FileExplorerApp from '../components/desktop/FileExplorerApp.jsx';
import './BoosterverseDesktop.css';

const APPS = {
  explorer: { title: 'Tiedostonhallinta', icon: '📁' },
};

function createWindow(app, zIndex) {
  return {
    id: `${app}-${Date.now()}`,
    app,
    title: APPS[app].title,
    icon: APPS[app].icon,
    x: 140 + Math.round(Math.random() * 60),
    y: 90 + Math.round(Math.random() * 40),
    width: 760,
    height: 500,
    zIndex,
    minimized: false,
    maximized: false,
  };
}

export default function BoosterverseDesktop() {
  const [windows, setWindows] = useState(() => [createWindow('explorer', 1)]);
  const [nextZ, setNextZ] = useState(2);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  function focusWindow(id) {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ, minimized: false } : w)));
    setNextZ((z) => z + 1);
  }

  function moveWindow(id, x, y) {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }

  function resizeWindow(id, width, height) {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  }

  function closeWindow(id) {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }

  function minimizeWindow(id) {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }

  function maximizeWindow(id) {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)));
  }

  function openApp(app) {
    setStartOpen(false);
    const existing = windows.find((w) => w.app === app);
    if (existing) {
      focusWindow(existing.id);
      return;
    }
    setWindows((prev) => [...prev, createWindow(app, nextZ)]);
    setNextZ((z) => z + 1);
  }

  return (
    <div className="win-desktop" onMouseDown={() => setStartOpen(false)}>
      <div className="win-desktop-icons">
        <button className="win-desktop-icon" onDoubleClick={() => openApp('explorer')}>
          <span className="win-desktop-icon-glyph">📁</span>
          <span className="win-desktop-icon-label">Tiedostonhallinta</span>
        </button>
      </div>

      {windows.map((w) => (
        <WindowFrame
          key={w.id}
          win={w}
          onFocus={() => focusWindow(w.id)}
          onMove={(x, y) => moveWindow(w.id, x, y)}
          onResize={(width, height) => resizeWindow(w.id, width, height)}
          onClose={() => closeWindow(w.id)}
          onMinimize={() => minimizeWindow(w.id)}
          onMaximize={() => maximizeWindow(w.id)}
        >
          {w.app === 'explorer' && <FileExplorerApp />}
        </WindowFrame>
      ))}

      {startOpen && (
        <div className="win-start-menu" onMouseDown={(e) => e.stopPropagation()}>
          <div className="win-start-header">Wood-Booster</div>
          <button className="win-start-app" onClick={() => openApp('explorer')}>
            <span>📁</span> Tiedostonhallinta
          </button>
          <div className="win-start-footer">
            Vain katselu tässä versiossa - Wood-Booster-AI-projektikansio.
          </div>
        </div>
      )}

      <div className="win-taskbar" onMouseDown={(e) => e.stopPropagation()}>
        <button
          className={`win-start-button ${startOpen ? 'active' : ''}`}
          onClick={() => setStartOpen((v) => !v)}
        >
          🪟
        </button>
        <div className="win-taskbar-apps">
          {windows.map((w) => (
            <button
              key={w.id}
              className={`win-taskbar-app ${!w.minimized ? 'active' : ''}`}
              onClick={() => (w.minimized ? focusWindow(w.id) : minimizeWindow(w.id))}
            >
              {w.icon} {w.title}
            </button>
          ))}
        </div>
        <div className="win-taskbar-clock">
          {clock.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
