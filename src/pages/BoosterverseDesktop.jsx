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
import Tools from './Tools.jsx';
import DevStudio from './DevStudio.jsx';
import ProjectWorkspace from './ProjectWorkspace.jsx';
import SpiderSolitaire from './SpiderSolitaire.jsx';
import GitGuardianCard from '../components/systemPulse/GitGuardianCard.jsx';
import './BoosterverseDesktop.css';

const WORKSPACE_API = 'http://127.0.0.1:8002/api/workspace';
const PULSE_STATUS_API = 'http://127.0.0.1:8002/api/pulse/status';
const PULSE_POLL_INTERVAL = 20000;
const DRAG_FILE_TYPE = 'application/x-wb-file-id';
const DRAG_ICON_TYPE = 'application/x-wb-icon-key';
const ICON_POSITIONS_KEY = 'wb-desktop-icon-positions';
const ICON_WIDTH = 84;
const ICON_HEIGHT = 92;
const TRASH_FOLDER_NAME = 'Roskakori';

const FILE_CATEGORY_ICON = {
  image: '🖼️',
  video: '🎬',
  pdf: '📄',
  archive: '🗜️',
  generic: '📦',
};

function loadIconPositions() {
  try {
    const raw = localStorage.getItem(ICON_POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

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
  tools: { title: 'Tools', icon: '▨', component: Tools, defaultWidth: 820, defaultHeight: 620 },
  devstudio: { title: 'Dev Studio', icon: 'λ', component: DevStudio, defaultWidth: 900, defaultHeight: 650 },
  projectworkspace: { title: 'Projektityötila', icon: '🗂', component: ProjectWorkspace, defaultWidth: 920, defaultHeight: 600 },
  spidersolitaire: { title: 'Spider-pasianssi', icon: '♤', component: SpiderSolitaire, defaultWidth: 900, defaultHeight: 650 },
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
  const iconsAreaRef = useRef(null);
  const startButtonRef = useRef(null);
  const [startMenuLeft, setStartMenuLeft] = useState(null);
  const [isDesktopDragging, setIsDesktopDragging] = useState(false);
  const [dropFeedback, setDropFeedback] = useState(null);
  const [rootItems, setRootItems] = useState({ folders: [], files: [] });
  const [iconPositions, setIconPositions] = useState(loadIconPositions);
  const [dragOverIconKey, setDragOverIconKey] = useState(null);
  const [pulseStatus, setPulseStatus] = useState({ online: null, disk: null, git: null });
  const [rootItemsLoaded, setRootItemsLoaded] = useState(false);
  const [trashFolderId, setTrashFolderId] = useState(null);
  const [trashCount, setTrashCount] = useState(0);
  const trashEnsuredRef = useRef(false);

  useEffect(() => {
    // Tehtäväpalkin tarjonta-alue näytti aiemmin pelkkiä koriste-emojeja
    // (wifi/äänenvoimakkuus/akku, ei mitään kytköstä oikeaan tilaan) - Marc
    // halusi oikeaa tietoa niiden tilalle. System Pulse -moduuli laskee jo
    // levytilan ja git-tilan reaalisesti /api/pulse/status:issa - käytetään
    // sitä sellaisenaan sen sijaan että keksittäisiin uusi rinnakkainen
    // tietolähde vain työpöytää varten.
    let cancelled = false;
    function poll() {
      fetch(PULSE_STATUS_API)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((data) => {
          if (cancelled) return;
          setPulseStatus({ online: true, disk: data.disk_usage, git: data.git_info });
        })
        .catch(() => {
          if (cancelled) return;
          setPulseStatus((prev) => ({ ...prev, online: false }));
        });
    }
    poll();
    const interval = setInterval(poll, PULSE_POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!dropFeedback) return;
    const timeout = setTimeout(() => setDropFeedback(null), 3500);
    return () => clearTimeout(timeout);
  }, [dropFeedback]);

  useEffect(() => {
    // Työpöydän juurikansion sisältö näkyy suoraan kuvakkeina työpöydällä,
    // kuten oikealla käyttöjärjestelmällä - ei tarvitse avata mitään
    // ikkunaa nähdäkseen mitä sinne on tallennettu.
    fetch(`${WORKSPACE_API}/folders`)
      .then((res) => (res.ok ? res.json() : { folders: [], files: [] }))
      .then((data) => {
        setRootItems({ folders: data.folders || [], files: data.files || [] });
        setRootItemsLoaded(true);
      })
      .catch(() => setRootItemsLoaded(true));
  }, [refreshCounter]);

  useEffect(() => {
    // Roskakori on ihan tavallinen kansio, ei erikoiskäsitelty backendissä -
    // varmistetaan että se on olemassa juurikansiossa (luodaan kerran jos
    // puuttuu) ja piilotetaan se sitten normaalista kansiolistasta, koska se
    // saa oman kiinteän kuvakkeensa työpöydän kulmassa. rootItemsLoaded
    // odottaa ensimmäisen oikean haun valmistumista, jottei tyhjä
    // alkutilanne ehdi luoda ylimääräistä kansiota ennen kuin tiedetään
    // onko sellainen jo olemassa.
    if (!rootItemsLoaded) return;
    const existing = rootItems.folders.find((f) => f.name === TRASH_FOLDER_NAME);
    if (existing) {
      setTrashFolderId(existing.id);
      return;
    }
    if (trashEnsuredRef.current) return;
    trashEnsuredRef.current = true;
    fetch(`${WORKSPACE_API}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: TRASH_FOLDER_NAME, parent_id: null }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((folder) => {
        setTrashFolderId(folder.id);
        setRefreshCounter((c) => c + 1);
      })
      .catch(() => {});
  }, [rootItemsLoaded, rootItems.folders]);

  useEffect(() => {
    if (!trashFolderId) {
      setTrashCount(0);
      return;
    }
    fetch(`${WORKSPACE_API}/folders?parent_id=${encodeURIComponent(trashFolderId)}`)
      .then((res) => (res.ok ? res.json() : { folders: [], files: [] }))
      .then((data) => setTrashCount((data.folders?.length || 0) + (data.files?.length || 0)))
      .catch(() => {});
  }, [trashFolderId, refreshCounter]);

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
    // clientX/clientY talletetaan sellaisenaan myös, jotta "Uusi kansio"
    // -toiminto voi sijoittaa uuden kuvakkeen tarkalleen klikkauskohtaan
    // (sama laskutapa kuin handleDesktopDrop:issa).
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, clientX: e.clientX, clientY: e.clientY });
  }

  function handleRefresh() {
    setRefreshCounter((c) => c + 1);
    setContextMenu(null);
  }

  function handleCreateFolderFromContextMenu() {
    const clickPoint = contextMenu;
    setContextMenu(null);
    const name = window.prompt('Kansion nimi:', 'Uusi kansio');
    if (!name || !name.trim()) return;

    fetch(`${WORKSPACE_API}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), parent_id: null }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((folder) => {
        if (clickPoint && iconsAreaRef.current) {
          const rect = iconsAreaRef.current.getBoundingClientRect();
          const x = Math.min(
            Math.max(0, clickPoint.clientX - rect.left - ICON_WIDTH / 2),
            Math.max(0, rect.width - ICON_WIDTH)
          );
          const y = Math.min(
            Math.max(0, clickPoint.clientY - rect.top - 24),
            Math.max(0, rect.height - ICON_HEIGHT)
          );
          persistIconPositions({ ...iconPositions, [`folder:${folder.id}`]: { x, y } });
        }
        setRefreshCounter((c) => c + 1);
      })
      .catch(() => setDropFeedback({ message: 'Kansion luonti epäonnistui.', tone: 'error' }));
  }

  function handleEmptyTrash() {
    setContextMenu(null);
    if (!trashFolderId) return;
    fetch(`${WORKSPACE_API}/folders?parent_id=${encodeURIComponent(trashFolderId)}`)
      .then((res) => (res.ok ? res.json() : { folders: [], files: [] }))
      .then((data) => {
        const files = data.files || [];
        if (files.length === 0) return Promise.resolve([]);
        return Promise.allSettled(
          files.map((f) => fetch(`${WORKSPACE_API}/files/${f.id}`, { method: 'DELETE' }))
        );
      })
      .then(() => {
        setDropFeedback({ message: 'Roskakori tyhjennetty.', tone: 'success' });
        setRefreshCounter((c) => c + 1);
      })
      .catch(() => setDropFeedback({ message: 'Roskakorin tyhjennys epäonnistui.', tone: 'error' }));
  }

  function handleDesktopDragOver(e) {
    e.preventDefault();
    // Kuvakkeen siirto työpöydällä (raahaus toiseen kohtaan) ei ole
    // ulkoisen tiedoston pudotus - ei näytetä "pudota tiedosto tähän"
    // -ylälaskosta silloin, Marc: "ilman että se herjaa tiedostonpudotuksesta".
    if (e.dataTransfer.types.includes(DRAG_ICON_TYPE)) return;
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

  function persistIconPositions(next) {
    setIconPositions(next);
    try {
      localStorage.setItem(ICON_POSITIONS_KEY, JSON.stringify(next));
    } catch {
      // localStorage voi olla estetty (esim. yksityinen selaus) - sijainnit
      // toimivat silti tämän istunnon ajan, vain eivät säily seuraavaan kertaan.
    }
  }

  function moveFileToFolder(fileId, folderId) {
    fetch(`${WORKSPACE_API}/files/${fileId}/move`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    }).then((res) => {
      if (res.ok) setRefreshCounter((c) => c + 1);
    });
  }

  async function handleDesktopDrop(e) {
    e.preventDefault();
    setIsDesktopDragging(false);

    // Työpöydän kuvakkeen raahaus vapaaseen kohtaan - pelkkä sijainnin
    // muutos, ei tiedoston lataus. Kansion päälle pudotus käsitellään sen
    // omassa onDrop:issa (stopPropagation), joten tänne asti asti päätyvät
    // vain tyhjälle työpöydälle pudotetut kuvakkeet.
    if (e.dataTransfer.types.includes(DRAG_ICON_TYPE)) {
      const key = e.dataTransfer.getData(DRAG_ICON_TYPE);
      if (key && iconsAreaRef.current) {
        const rect = iconsAreaRef.current.getBoundingClientRect();
        const x = Math.min(
          Math.max(0, e.clientX - rect.left - ICON_WIDTH / 2),
          Math.max(0, rect.width - ICON_WIDTH)
        );
        const y = Math.min(
          Math.max(0, e.clientY - rect.top - 24),
          Math.max(0, rect.height - ICON_HEIGHT)
        );
        persistIconPositions({ ...iconPositions, [key]: { x, y } });
      }
      return;
    }

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    // Tallennetaan pudotuskohta ennen await:eja - Marc: "sijoittamaan
    // tiedoston mihin haluan työpöytänäkymässä", "sen pitää toimia kuin
    // Windows 96 käyttöjärjestelmä" - uusi tiedosto ilmestyy tarkalleen
    // siihen kohtaan johon se pudotettiin, ei oletus-ruudukkoon. Useampi
    // samalla kertaa pudotettu tiedosto porrastetaan hieman ettei kuvakkeet
    // mene täysin päällekkäin.
    const dropRect = iconsAreaRef.current?.getBoundingClientRect();
    const dropX = dropRect ? Math.max(0, e.clientX - dropRect.left - ICON_WIDTH / 2) : null;
    const dropY = dropRect ? Math.max(0, e.clientY - dropRect.top - 24) : null;

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
          ? `${succeeded} tiedosto${succeeded === 1 ? '' : 'a'} tallennettu työpöydälle.`
          : `${succeeded} tallennettu, ${failed} epäonnistui.`,
      tone: failed === 0 ? 'success' : 'error',
    });

    // Ei avata mitään ikkunaa - uudet tiedostot ilmestyvät suoraan
    // kuvakkeina työpöydälle refreshCounterin päivityksen kautta, kuten
    // Marc pyysi ("voisin vain pudottaa tiedoston työpöydälle").
    if (succeeded > 0) {
      if (dropX !== null && dropY !== null) {
        const placed = { ...iconPositions };
        let placedIndex = 0;
        for (const result of results) {
          if (result.status !== 'fulfilled') continue;
          placed[`file:${result.value.id}`] = { x: dropX + placedIndex * 18, y: dropY + placedIndex * 18 };
          placedIndex += 1;
        }
        persistIconPositions(placed);
      }
      setRefreshCounter((c) => c + 1);
    }
  }

  function openFileIcon(file) {
    window.open(`${WORKSPACE_API}/files/${file.id}/download`, '_blank', 'noopener');
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

  // Yksi yhtenäinen kuvakelista (kiinnitetyt sovellukset + työpöydän
  // juurikansion kansiot/tiedostot) - sama raahaus/pudotus-logiikka
  // pätee kaikkiin, riippumatta siitä ovatko ne sovellus-, kansio- vai
  // tiedostokuvakkeita.
  const desktopIcons = [
    ...Object.entries(APPS).map(([key, app]) => ({
      key: `app:${key}`,
      glyph: app.icon,
      label: app.title,
      isFolder: false,
      isFile: false,
      onOpen: () => openApp(key),
    })),
    ...rootItems.folders
      .filter((folder) => folder.id !== trashFolderId)
      .map((folder) => ({
        key: `folder:${folder.id}`,
        glyph: '📁',
        label: folder.name,
        isFolder: true,
        isFile: false,
        onOpen: () => openApp('explorer'),
      })),
    ...rootItems.files.map((file) => ({
      key: `file:${file.id}`,
      glyph: FILE_CATEGORY_ICON[file.category] || FILE_CATEGORY_ICON.generic,
      thumb: file.category === 'image' && file.has_thumbnail ? `${WORKSPACE_API}/files/${file.id}/thumbnail` : null,
      label: file.original_name,
      isFolder: false,
      isFile: true,
      fileId: file.id,
      onOpen: () => openFileIcon(file),
    })),
  ];

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
            <span>Pudota tiedostot tähän - ne ilmestyvät kuvakkeina työpöydälle</span>
          </div>
        </div>
      )}

      {dropFeedback && (
        <div className={`win-desktop-toast win-desktop-toast-${dropFeedback.tone}`}>
          {dropFeedback.message}
        </div>
      )}

      {showDesktopIcons && (
        <div ref={iconsAreaRef} className="win-desktop-icons">
          {desktopIcons.map((item) => {
            const pos = iconPositions[item.key];
            return (
              <button
                key={item.key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(DRAG_ICON_TYPE, item.key);
                  if (item.isFile) e.dataTransfer.setData(DRAG_FILE_TYPE, item.fileId);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={
                  item.isFolder
                    ? (e) => {
                        if (!e.dataTransfer.types.includes(DRAG_FILE_TYPE)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverIconKey(item.key);
                      }
                    : undefined
                }
                onDragLeave={
                  item.isFolder
                    ? () => setDragOverIconKey((prev) => (prev === item.key ? null : prev))
                    : undefined
                }
                onDrop={
                  item.isFolder
                    ? (e) => {
                        if (!e.dataTransfer.types.includes(DRAG_FILE_TYPE)) return;
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverIconKey(null);
                        const fileId = e.dataTransfer.getData(DRAG_FILE_TYPE);
                        const folderId = item.key.slice('folder:'.length);
                        if (fileId) moveFileToFolder(fileId, folderId);
                      }
                    : undefined
                }
                onDoubleClick={item.onOpen}
                title={item.label}
                className={`win-desktop-icon ${dragOverIconKey === item.key ? 'win-desktop-icon-drop-target' : ''}`}
                style={pos ? { position: 'absolute', left: pos.x, top: pos.y } : undefined}
              >
                {item.thumb ? (
                  <img className="win-desktop-icon-thumb" src={item.thumb} alt="" />
                ) : (
                  <span className="win-desktop-icon-glyph">{item.glyph}</span>
                )}
                <span className="win-desktop-icon-label">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {trashFolderId && (
        <button
          className={`win-desktop-icon win-desktop-trash ${dragOverIconKey === 'trash' ? 'win-desktop-icon-drop-target' : ''}`}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(DRAG_FILE_TYPE)) return;
            e.preventDefault();
            e.stopPropagation();
            setDragOverIconKey('trash');
          }}
          onDragLeave={() => setDragOverIconKey((prev) => (prev === 'trash' ? null : prev))}
          onDrop={(e) => {
            if (!e.dataTransfer.types.includes(DRAG_FILE_TYPE)) return;
            e.preventDefault();
            e.stopPropagation();
            setDragOverIconKey(null);
            const fileId = e.dataTransfer.getData(DRAG_FILE_TYPE);
            if (fileId) moveFileToFolder(fileId, trashFolderId);
          }}
          onDoubleClick={() => openApp('explorer')}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setStartOpen(false);
            const rect = desktopRef.current.getBoundingClientRect();
            setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, kind: 'trash' });
          }}
          title={trashCount > 0 ? `Roskakori (${trashCount})` : 'Roskakori (tyhjä)'}
        >
          <span className="win-desktop-icon-glyph">{trashCount > 0 ? '🗑️' : '🗑'}</span>
          <span className="win-desktop-icon-label">Roskakori</span>
          {trashCount > 0 && <span className="win-desktop-trash-badge">{trashCount}</span>}
        </button>
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
          {contextMenu.kind === 'trash' ? (
            <button onClick={handleEmptyTrash} disabled={trashCount === 0}>
              🗑️ Tyhjennä roskakori{trashCount > 0 ? ` (${trashCount})` : ''}
            </button>
          ) : (
            <>
              <button onClick={handleCreateFolderFromContextMenu}>📁 Uusi kansio</button>
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
            </>
          )}
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
          <span
            className="win-tray-icon"
            title={
              pulseStatus.online === null
                ? 'Tarkistetaan taustapalvelinta...'
                : pulseStatus.online
                ? 'Taustapalvelin yhteydessä'
                : 'Taustapalvelin ei vastaa'
            }
          >
            {pulseStatus.online === null ? '⚪' : pulseStatus.online ? '🟢' : '🔴'}
          </span>
          <span
            className="win-tray-icon"
            title={
              pulseStatus.disk
                ? `Levytila: ${pulseStatus.disk.free_gb} GB vapaana / ${pulseStatus.disk.total_gb} GB (${pulseStatus.disk.used_percentage}% käytetty)`
                : 'Levytila ei tiedossa'
            }
          >
            💾 {pulseStatus.disk ? `${pulseStatus.disk.used_percentage}%` : '…'}
          </span>
          <span
            className="win-tray-icon"
            title={
              pulseStatus.git
                ? pulseStatus.git.uncommitted_changes
                  ? `Tallentamattomia muutoksia (${pulseStatus.git.branch})`
                  : `Kaikki tallennettu (${pulseStatus.git.branch})`
                : 'Git-tieto ei saatavilla'
            }
          >
            {pulseStatus.git ? (pulseStatus.git.uncommitted_changes ? '🟠' : '✅') : '◌'}{' '}
            {pulseStatus.git?.branch || 'git'}
          </span>
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
