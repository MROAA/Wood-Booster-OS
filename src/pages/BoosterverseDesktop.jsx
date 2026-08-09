import { useEffect, useRef, useState } from 'react';
import WindowFrame from '../components/desktop/WindowFrame.jsx';
import FileExplorerApp from '../components/desktop/FileExplorerApp.jsx';
import TerminalApp from '../components/desktop/TerminalApp.jsx';
import SpacemonkeyChatApp from '../components/desktop/SpacemonkeyChatApp.jsx';
import './BoosterverseDesktop.css';

const APPS = {
  explorer: { title: 'Tiedostonhallinta', icon: '📁' },
  terminal: { title: 'Pääte (fish)', icon: '💻' },
  spacemonkey: { title: 'Spacemonkey', icon: '🐒' },
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

export default function BoosterverseDesktop({ onExit }) {
  const [windows, setWindows] = useState(() => [createWindow('explorer', 1)]);
  const [nextZ, setNextZ] = useState(2);
  const [startOpen, setStartOpen] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [search, setSearch] = useState('');
  const [showDesktopIcons, setShowDesktopIcons] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);
  const desktopRef = useRef(null);
  const startButtonRef = useRef(null);
  const [startMenuLeft, setStartMenuLeft] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    }
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

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

  function minimizeAll() {
    setWindows((prev) => prev.map((w) => ({ ...w, minimized: true })));
    setStartOpen(false);
  }

  function openApp(app) {
    setStartOpen(false);
    setSearch('');
    const existing = windows.find((w) => w.app === app);
    if (existing) {
      focusWindow(existing.id);
      return;
    }
    setWindows((prev) => [...prev, createWindow(app, nextZ)]);
    setNextZ((z) => z + 1);
  }

  function handleDesktopContextMenu(e) {
    e.preventDefault();
    setStartOpen(false);
    // Valikko asemoituu (position: absolute) suhteessa .win-desktop-
    // konttiin, mutta clientX/clientY ovat koko selainikkunan koordinaatteja
    // - .win-desktop ei ala näytön vasemmasta yläkulmasta (sivupalkki vie
    // tilaa), joten offset pitää vähentää tai valikko ilmestyy väärään kohtaan.
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleRefresh() {
    setRefreshCounter((c) => c + 1);
    setContextMenu(null);
  }

  function toggleStart() {
    setStartOpen((prev) => {
      const next = !prev;
      // Keskitetään Start-valikko oikeasti Start-napin päälle (ei koko
      // ruudun keskelle) - napin sijainti riippuu tehtäväpalkin muiden
      // kohteiden leveydestä, joten sitä ei voi tietää etukäteen CSS:llä.
      if (next && startButtonRef.current && desktopRef.current) {
        const btnRect = startButtonRef.current.getBoundingClientRect();
        const deskRect = desktopRef.current.getBoundingClientRect();
        setStartMenuLeft(btnRect.left + btnRect.width / 2 - deskRect.left);
      }
      return next;
    });
  }

  const query = search.trim().toLowerCase();
  const visibleApps = Object.entries(APPS).filter(([, app]) =>
    app.title.toLowerCase().includes(query)
  );

  return (
    <div
      ref={desktopRef}
      className="win-desktop"
      onMouseDown={() => setStartOpen(false)}
      onContextMenu={handleDesktopContextMenu}
    >
      {showDesktopIcons && (
        <div className="win-desktop-icons">
          <button className="win-desktop-icon" onDoubleClick={() => openApp('explorer')}>
            <span className="win-desktop-icon-glyph">📁</span>
            <span className="win-desktop-icon-label">Tiedostonhallinta</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('terminal')}>
            <span className="win-desktop-icon-glyph">💻</span>
            <span className="win-desktop-icon-label">Pääte</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('spacemonkey')}>
            <span className="win-desktop-icon-glyph">🐒</span>
            <span className="win-desktop-icon-label">Spacemonkey</span>
          </button>
        </div>
      )}

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
          {w.app === 'explorer' && <FileExplorerApp refreshSignal={refreshCounter} />}
          {w.app === 'terminal' && (
            <div className="terminal-app-wrapper">
              <div className="terminal-warning">
                ⚠️ Oikea pääte - komennot suoritetaan oikeasti tällä koneella.
              </div>
              {/* Ei päivitetä resizeSignal-arvoa kun ikkuna on pienennetty
                  (display:none) - piilotettu elementti mittautuisi 0x0:ksi
                  ja lähettäisi virheellisen koon päätteelle. */}
              <TerminalApp resizeSignal={w.minimized ? undefined : `${w.width}x${w.height}-${w.maximized}`} />
            </div>
          )}
          {w.app === 'spacemonkey' && <SpacemonkeyChatApp />}
        </WindowFrame>
      ))}

      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="win-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button onClick={handleRefresh}>↻ Päivitä</button>
          <button
            onClick={() => {
              setShowDesktopIcons((v) => !v);
              setContextMenu(null);
            }}
          >
            {showDesktopIcons ? '⬚ Piilota työpöydän kuvakkeet' : '⬚ Näytä työpöydän kuvakkeet'}
          </button>
          <button className="disabled" disabled title="Tulossa myöhemmin">
            🎨 Mukauta
          </button>
        </div>
      )}

      {startOpen && (
        <div
          className="win-start-menu"
          style={startMenuLeft !== null ? { left: startMenuLeft } : undefined}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <img
            src="/branding/wood-booster-banner.jpg"
            alt="Wood-Booster - Puun ehdoilla"
            className="win-start-banner"
          />
          <input
            type="text"
            className="win-start-search"
            placeholder="Hae sovelluksia"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <div className="win-start-section-label">Kiinnitetyt</div>
          <div className="win-start-grid">
            {visibleApps.map(([key, app]) => (
              <button key={key} className="win-start-tile" onClick={() => openApp(key)}>
                <span className="win-start-tile-glyph">{app.icon}</span>
                <span className="win-start-tile-label">{app.title}</span>
              </button>
            ))}
            {visibleApps.length === 0 && (
              <div className="win-start-empty">Ei tuloksia haulle "{search}".</div>
            )}
          </div>

          <div className="win-start-footer-row">
            <span className="win-start-footer">Vain katselu - Wood-Booster-AI-projektikansio.</span>
            <button className="win-power-button" onClick={minimizeAll} title="Pienennä kaikki ikkunat">
              ⏻
            </button>
          </div>
        </div>
      )}

      <div className="win-taskbar" onMouseDown={(e) => e.stopPropagation()}>
        <div className="win-taskbar-center">
          <button
            ref={startButtonRef}
            className={`win-start-button ${startOpen ? 'active' : ''}`}
            onClick={toggleStart}
          >
            🪟
          </button>
          <div className="win-taskbar-search" onClick={() => !startOpen && toggleStart()}>
            🔍 <span>Hae</span>
          </div>
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
        </div>

        <div className="win-taskbar-tray">
          <span className="win-tray-icon" title="Wi-Fi">📶</span>
          <span className="win-tray-icon" title="Äänenvoimakkuus">🔊</span>
          <span className="win-tray-icon" title="Akku">🔋</span>
          <div className="win-taskbar-clock">
            <div>{clock.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="win-taskbar-date">{clock.toLocaleDateString('fi-FI')}</div>
          </div>
          {onExit && (
            <button
              className="win-exit-corner"
              onClick={onExit}
              title="Takaisin Wood-Booster HQ:hon"
            >
              ⌂
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
