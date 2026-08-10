import { useEffect, useRef, useState } from 'react';
import WindowFrame from '../components/desktop/WindowFrame.jsx';
import TerminalApp from '../components/desktop/TerminalApp.jsx';
import VirtualWorkspacePanel from '../components/workspace/VirtualWorkspacePanel.jsx';
import Projects from './Projects.jsx';
import Settings from './Settings.jsx';
import SystemPulse from './SystemPulse.jsx';
import SpacemonkeyChat from './SpacemonkeyChat.jsx';
import Knowledge from './Knowledge.jsx';
import KnowledgeUpload from './KnowledgeUpload.jsx';
import Memory from './Memory.jsx';
import SpacemonkeyBrain from './SpacemonkeyBrain.jsx';
import GitGuardianCard from '../components/systemPulse/GitGuardianCard.jsx';
import './BoosterverseDesktop.css';

const WORKSPACE_API = 'http://127.0.0.1:8002/api/workspace';

const APPS = {
  explorer: { title: 'Tiedostonhallinta', icon: '📁', component: VirtualWorkspacePanel, defaultWidth: 820, defaultHeight: 600 },
  terminal: { title: 'Pääte (fish)', icon: '💻', component: TerminalApp, defaultWidth: 760, defaultHeight: 500 },
  projects: { title: 'Projektit', icon: '📁', component: Projects, defaultWidth: 800, defaultHeight: 560 },
  spacemonkey: { title: 'Spacemonkey', icon: '🐒', component: SpacemonkeyChat, defaultWidth: 520, defaultHeight: 600 },
  systempulse: { title: 'System Pulse', icon: '🧠', component: SystemPulse, defaultWidth: 700, defaultHeight: 650 },
  gitguardian: { title: 'Git Guardian', icon: '🛡', component: GitGuardianCard, defaultWidth: 480, defaultHeight: 520 },
  knowledge: { title: 'Knowledge', icon: '◌', component: Knowledge, defaultWidth: 820, defaultHeight: 620 },
  knowledgeupload: { title: 'Tiedostojen lataus', icon: '📥', component: KnowledgeUpload, defaultWidth: 560, defaultHeight: 520 },
  memory: { title: 'Memory', icon: '◈', component: Memory, defaultWidth: 780, defaultHeight: 620 },
  spacemonkeybrain: { title: 'Spacemonkey Brain', icon: '⬡', component: SpacemonkeyBrain, defaultWidth: 660, defaultHeight: 560 },
  settings: { title: 'Asetukset', icon: '⚙', component: Settings, defaultWidth: 700, defaultHeight: 600 },
};

function createWindow(app, zIndex) {
  return {
    id: `${app}-${Date.now()}`,
    app,
    title: APPS[app].title,
    icon: APPS[app].icon,
    x: 140 + Math.round(Math.random() * 60),
    y: 90 + Math.round(Math.random() * 40),
    width: APPS[app].defaultWidth,
    height: APPS[app].defaultHeight,
    zIndex,
    minimized: false,
    maximized: false,
  };
}

export default function BoosterverseDesktop({ onExit }) {
  const [windows, setWindows] = useState(() => []);
  const [nextZ, setNextZ] = useState(1);
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
  const [isDesktopDragging, setIsDesktopDragging] = useState(false);
  const [dropFeedback, setDropFeedback] = useState(null);

  useEffect(() => {
    if (!dropFeedback) return;
    const timeout = setTimeout(() => setDropFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [dropFeedback]);

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

  function handleDesktopDragOver(e) {
    e.preventDefault();
    setIsDesktopDragging(true);
  }

  function handleDesktopDragLeave(e) {
    // Työpöytä sisältää kuvakkeita, ikkunoita ja tehtäväpalkin - hiiri
    // liikkuu jatkuvasti lapsielementtien rajojen yli raahauksen aikana,
    // mikä laukaisisi dragLeaven turhaan ellei tarkisteta ettei kohde ole
    // yhä työpöydän sisällä.
    if (desktopRef.current && desktopRef.current.contains(e.relatedTarget)) {
      return;
    }
    setIsDesktopDragging(false);
  }

  async function handleDesktopDrop(e) {
    e.preventDefault();
    setIsDesktopDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const results = await Promise.allSettled(
      files.map((file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${WORKSPACE_API}/upload`, { method: 'POST', body: formData }).then((res) => {
          if (!res.ok) throw new Error(res.status);
          return res.json();
        });
      })
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;
    setDropFeedback({
      message:
        failed === 0
          ? `${succeeded} tiedosto${succeeded === 1 ? '' : 'a'} tallennettu Tiedostonhallintaan.`
          : `${succeeded} tallennettu, ${failed} epäonnistui.`,
      tone: failed === 0 ? 'success' : 'error',
    });

    if (succeeded > 0) {
      setRefreshCounter((c) => c + 1);
      openApp('explorer');
    }
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

  function renderAppContent(w) {
    const AppComponent = APPS[w.app]?.component;
    if (!AppComponent) return null;
    if (w.app === 'explorer') return <AppComponent refreshSignal={refreshCounter} />;
    if (w.app === 'terminal') {
      return (
        <div className="terminal-app-wrapper">
          <div className="terminal-warning">
            ⚠️ Oikea pääte - komennot suoritetaan oikeasti tällä koneella.
          </div>
          {/* Ei päivitetä resizeSignal-arvoa kun ikkuna on pienennetty
              (display:none) - piilotettu elementti mittautuisi 0x0:ksi
              ja lähettäisi virheellisen koon päätteelle. */}
          <AppComponent resizeSignal={w.minimized ? undefined : `${w.width}x${w.height}-${w.maximized}`} />
        </div>
      );
    }
    return (
      <div className="desktop-app-scroll">
        <AppComponent />
      </div>
    );
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
      onDragOver={handleDesktopDragOver}
      onDragLeave={handleDesktopDragLeave}
      onDrop={handleDesktopDrop}
    >
      {isDesktopDragging && (
        <div className="win-desktop-drop-overlay">
          <div className="win-desktop-drop-hint">
            <span className="win-desktop-drop-hint-glyph">📥</span>
            <span>Pudota tiedostot tähän tallentaaksesi ne Tiedostonhallintaan</span>
          </div>
        </div>
      )}

      {dropFeedback && (
        <div className={`win-desktop-toast win-desktop-toast-${dropFeedback.tone}`}>
          {dropFeedback.message}
        </div>
      )}

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
          <button className="win-desktop-icon" onDoubleClick={() => openApp('projects')}>
            <span className="win-desktop-icon-glyph">📁</span>
            <span className="win-desktop-icon-label">Projektit</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('spacemonkey')}>
            <span className="win-desktop-icon-glyph">🐒</span>
            <span className="win-desktop-icon-label">Spacemonkey</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('systempulse')}>
            <span className="win-desktop-icon-glyph">🧠</span>
            <span className="win-desktop-icon-label">System Pulse</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('gitguardian')}>
            <span className="win-desktop-icon-glyph">🛡</span>
            <span className="win-desktop-icon-label">Git Guardian</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('knowledge')}>
            <span className="win-desktop-icon-glyph">◌</span>
            <span className="win-desktop-icon-label">Knowledge</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('knowledgeupload')}>
            <span className="win-desktop-icon-glyph">📥</span>
            <span className="win-desktop-icon-label">Tiedostojen lataus</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('memory')}>
            <span className="win-desktop-icon-glyph">◈</span>
            <span className="win-desktop-icon-label">Memory</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('spacemonkeybrain')}>
            <span className="win-desktop-icon-glyph">⬡</span>
            <span className="win-desktop-icon-label">Spacemonkey Brain</span>
          </button>
          <button className="win-desktop-icon" onDoubleClick={() => openApp('settings')}>
            <span className="win-desktop-icon-glyph">⚙</span>
            <span className="win-desktop-icon-label">Asetukset</span>
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
          {renderAppContent(w)}
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
