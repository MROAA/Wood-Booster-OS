import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import StudioHome from "../components/hearthwood-studio/StudioHome"
import StudioPane from "../components/hearthwood-studio/StudioPane"
import StudioToast from "../components/hearthwood-studio/StudioToast"
import SpacemonkeyAssistant from "../components/hearthwood-studio/SpacemonkeyAssistant"
import WorkspaceNav from "../components/hearthwood-studio/WorkspaceNav"
import { labelFor } from "../components/hearthwood-studio/entityTypes"
import { t } from "../components/hearthwood-studio/studioText"
import {
  HOME_TAB_ID, STORAGE_KEY, TOOL_VIEWS, activateTab, closeTab, createWorkspace, locationForAction,
  locationForEntity, locationForRoom, locationForWish, locationFromUrl, openTab,
  restoreWorkspace, serializeWorkspace, updateTab,
} from "../components/hearthwood-studio/workspaceTabs"
import { roomById } from "../components/hearthwood-studio/studioRooms"
// The game's own "details open on hover" pop-up style (Marc: "käytä samaa pop up tyyliä paljolle tiedolle kuin pelissäkin").
import "../components/heartwood/heartwood-reveal.css"
// The Studio wears the game's own look (Marc: "esimerkki sille laadulle mitä peli tulee olemaan").
import "../components/hearthwood-studio/hearthwood-studio.css"

/*
 * Hearthwood Dev Studio - the workspace (Sprint 4, "Nordic fantasy
 * workstation", PRD V1.0 §3): workspace navigation on the left, editor
 * tabs in the middle, Spacemonkey permanently on the right (resizable,
 * kept alive when hidden so the conversation survives). Studio Home is a
 * pinned first tab; every editor opens in
 * its own tab (StudioPane) and stays alive while hidden, so switching tabs
 * never loses what is open. Re-opening an editor activates its tab.
 * Open tabs and the active one are restored after a restart (validated by
 * workspaceTabs.restoreWorkspace - storage is never trusted); old deep
 * links (?type=&id=, ?view=) open their editor as a tab. Closing a tab
 * that holds a previewed-but-not-applied change asks first.
 */

function loadWorkspace() {
  let workspace = createWorkspace()
  try {
    workspace = restoreWorkspace(window.localStorage.getItem(STORAGE_KEY))
  } catch {
    // storage unavailable (private window): start fresh
  }
  const linked = locationFromUrl(window.location.search)
  return linked ? openTab(workspace, linked).workspace : workspace
}

const LAYOUT_KEY = "hws.layout.v1"
// Hidden tabs kept alive besides the active one (PRD §6.3: heavy editors
// are not kept in memory needlessly). A tab with unsaved work is ALWAYS
// kept; an unloaded tab re-opens at the same place from its location.
// Measured with 12 tabs: 65 MB heap / 17k DOM nodes / 458 images all mounted.
const KEEP_ALIVE = 4
const ASSISTANT_MIN = 300
const ASSISTANT_MAX = 600

function loadLayout() {
  const fallback = { navCollapsed: false, assistantOpen: true, assistantWidth: 380 }
  try {
    const saved = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || "null")
    if (!saved || typeof saved !== "object") return fallback
    const width = Number(saved.assistantWidth)
    return {
      navCollapsed: saved.navCollapsed === true,
      assistantOpen: saved.assistantOpen !== false,
      assistantWidth: Number.isFinite(width) ? Math.min(ASSISTANT_MAX, Math.max(ASSISTANT_MIN, width)) : fallback.assistantWidth,
    }
  } catch {
    return fallback
  }
}

// What the active editor is, for Spacemonkey (PRD §11.5) - only what the
// tab really knows; no entry is guessed when none is selected.
function contextForTab(tab) {
  if (!tab || tab.pinned || !tab.location) return null
  const { view, type, id } = tab.location
  const listView = view === "single" || view === "sheet"
  return {
    view,
    type: listView ? type : undefined,
    id: view === "single" ? id : undefined,
    editorLabel: listView ? `${labelFor(type)}${view === "sheet" ? ` (${TOOL_VIEWS.sheet})` : ""}` : TOOL_VIEWS[view],
    entityName: view === "single" && id ? tab.title : undefined,
  }
}

function TabCloseDialog({ tab, onCancel, onConfirm }) {
  const cancelRef = useRef(null)
  useEffect(() => {
    cancelRef.current?.focus()
    const onKey = event => { if (event.key === "Escape") onCancel() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCancel])
  return (
    <div className="hws-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="hws-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hws-close-title"
        aria-describedby="hws-close-text"
        data-testid="unsaved-close-dialog"
        onClick={event => event.stopPropagation()}
      >
        <h2 id="hws-close-title" className="hws-display text-2xl font-semibold text-[var(--wood-text)]">
          {t("closeTitle", { title: tab.title })}
        </h2>
        <p id="hws-close-text" className="mt-2 text-sm text-[var(--wood-muted)]">
          {t("closeText")}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancelRef} type="button" className="hws-button" onClick={onCancel} data-testid="unsaved-close-cancel">
            {t("keepOpen")}
          </button>
          <button type="button" className="hws-button hws-button-danger" onClick={onConfirm} data-testid="unsaved-close-confirm">
            {t("closeDiscard")}
          </button>
        </div>
      </div>
    </div>
  )
}

function HearthwoodStudio() {
  const [workspace, setWorkspace] = useState(loadWorkspace)
  const [dirty, setDirty] = useState(() => new Set())
  const [closing, setClosing] = useState(null)
  const [notice, setNotice] = useState("")
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty
  const [layout, setLayout] = useState(loadLayout)
  useEffect(() => {
    try {
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
    } catch {
      // layout just won't be remembered
    }
  }, [layout])

  function startResize(event) {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = layout.assistantWidth
    const onMove = move => {
      const width = Math.min(ASSISTANT_MAX, Math.max(ASSISTANT_MIN, startWidth + (startX - move.clientX)))
      setLayout(current => ({ ...current, assistantWidth: width }))
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  function resizeByKey(event) {
    const step = event.shiftKey ? 48 : 16
    const delta = event.key === "ArrowLeft" ? step : event.key === "ArrowRight" ? -step : 0
    if (!delta) return
    event.preventDefault()
    setLayout(current => ({ ...current, assistantWidth: Math.min(ASSISTANT_MAX, Math.max(ASSISTANT_MIN, current.assistantWidth + delta)) }))
  }


  // Persist open tabs + the active one (restored on the next visit).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeWorkspace(workspace))
    } catch {
      // storage full or blocked: tabs just won't come back after a restart
    }
  }, [workspace])

  // Home tab active: the address bar shows the plain Studio address.
  useEffect(() => {
    if (workspace.activeId === HOME_TAB_ID && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [workspace.activeId])

  // Leaving the page with an unapplied preview open asks the browser to warn.
  useEffect(() => {
    if (!dirty.size) return undefined
    const onBeforeUnload = event => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty])

  const open = useCallback(location => {
    if (!location) return
    setWorkspace(current => {
      const result = openTab(current, location, { dirtyIds: dirtyRef.current })
      if (result.refused === "all-tabs-have-unsaved-work") {
        setNotice(t("tabsFull"))
      }
      return result.workspace
    })
  }, [])

  const handleLocationChange = useCallback((tabId, location, title) => {
    setWorkspace(current => updateTab(current, tabId, location, title))
  }, [])

  const handleDirtyChange = useCallback((tabId, isDirty) => {
    setDirty(current => {
      if (current.has(tabId) === isDirty) return current
      const next = new Set(current)
      if (isDirty) next.add(tabId)
      else next.delete(tabId)
      return next
    })
  }, [])

  const goHome = useCallback(() => setWorkspace(current => activateTab(current, HOME_TAB_ID)), [])

  function forgetTab(id) {
    setWorkspace(current => closeTab(current, id))
    handleDirtyChange(id, false)
  }

  function requestClose(tab) {
    if (dirty.has(tab.id)) setClosing(tab)
    else forgetTab(tab.id)
  }

  function onTabKeyDown(event, index) {
    const tabs = workspace.tabs
    let next = null
    if (event.key === "ArrowRight") next = tabs[(index + 1) % tabs.length]
    if (event.key === "ArrowLeft") next = tabs[(index - 1 + tabs.length) % tabs.length]
    if (event.key === "Home") next = tabs[0]
    if (event.key === "End") next = tabs[tabs.length - 1]
    if (next) {
      event.preventDefault()
      setWorkspace(current => activateTab(current, next.id))
      document.getElementById(`hws-tab-${next.id}`)?.focus()
    }
    if ((event.key === "Delete" || (event.key === "w" && (event.ctrlKey || event.metaKey))) && !tabs[index].pinned) {
      event.preventDefault()
      requestClose(tabs[index])
    }
  }

  // "Continue developing": the most recently used editor tab, if any.
  const lastEditor = useMemo(() => {
    const id = workspace.history.find(entry => entry !== HOME_TAB_ID)
    return workspace.tabs.find(tab => tab.id === id) || null
  }, [workspace])

  const homeHandlers = useMemo(() => ({
    onEnterRoom: room => open(locationForRoom(room)),
    onAction: (room, action) => {
      if (action.kind === "link") {
        window.open(action.href, "_blank", "noopener")
        return
      }
      open(locationForAction(room, action))
    },
    onWish: (answer, text) => open(locationForWish(answer, text)),
    onOpenEntity: (type, id) => open(locationForEntity(type, id)),
    onOpenView: view => open({ view, roomId: view === "theme" ? roomById("look")?.id : undefined }),
    onTool: tool => (tool.href ? window.open(tool.href, "_blank", "noopener") : open({ view: tool.view })),
    onContinue: tab => setWorkspace(current => activateTab(current, tab.id)),
  }), [open])

  const activeTab = workspace.tabs.find(tab => tab.id === workspace.activeId) || null
  const mounted = new Set([
    workspace.activeId,
    ...dirty,
    ...workspace.history.filter(id => id !== HOME_TAB_ID).slice(0, KEEP_ALIVE),
  ])
  const assistantContext = contextForTab(activeTab)

  return (
    <div
      className={`hws-root hws-workstation ${layout.navCollapsed ? "nav-collapsed" : ""} ${layout.assistantOpen ? "assistant-open" : "assistant-closed"}`}
      style={{ "--hws-assistant-width": `${layout.assistantWidth}px` }}
      data-testid="studio-workspace"
    >
      <StudioToast />

      <div className="hws-titlebar">
        <button
          type="button"
          className="hws-icon-button"
          onClick={() => setLayout(current => ({ ...current, navCollapsed: !current.navCollapsed }))}
          aria-label={t("toggleNav")}
          aria-expanded={!layout.navCollapsed}
          title={t("toggleNav")}
          data-testid="toggle-nav"
        >
          ☰
        </button>
        <span className="hws-rune hws-titlebar-rune" aria-hidden="true">ᛞ</span>
        <span className="hws-display hws-titlebar-name">{t("studioName")}</span>
        <span className="hws-titlebar-note">{t("safetyNote")}</span>
        <button
          type="button"
          className={`hws-icon-button hws-monkey-toggle ${layout.assistantOpen ? "is-on" : ""}`}
          onClick={() => setLayout(current => ({ ...current, assistantOpen: !current.assistantOpen }))}
          aria-label={t("toggleAssistant")}
          aria-expanded={layout.assistantOpen}
          aria-controls="hws-assistant-panel"
          title={t("toggleAssistant")}
          data-testid="toggle-assistant"
        >
          ᛋ Spacemonkey
        </button>
      </div>

      <div className="hws-body">
        <WorkspaceNav
          collapsed={layout.navCollapsed}
          activeLocation={activeTab?.location}
          homeActive={workspace.activeId === HOME_TAB_ID}
          onHome={goHome}
          onRoom={homeHandlers.onEnterRoom}
          onTool={homeHandlers.onTool}
        />

        <main className="hws-main">
          <div className="hws-tabstrip" role="tablist" aria-label={t("openEditors")} data-testid="workspace-tabs">
            {workspace.tabs.map((tab, index) => {
              const selected = tab.id === workspace.activeId
              return (
                <div key={tab.id} className={`hws-tab ${selected ? "is-active" : ""} ${tab.pinned ? "is-pinned" : ""}`} data-tab-id={tab.id}>
                  <button
                    id={`hws-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`hws-panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    className="hws-tab-label"
                    title={tab.title}
                    data-testid={tab.pinned ? "workspace-tab-home" : "workspace-tab"}
                    onClick={() => setWorkspace(current => activateTab(current, tab.id))}
                    onKeyDown={event => onTabKeyDown(event, index)}
                    onAuxClick={event => { if (event.button === 1 && !tab.pinned) requestClose(tab) }}
                    ref={selected ? element => element?.scrollIntoView?.({ block: "nearest", inline: "nearest" }) : undefined}
                  >
                    {tab.pinned ? <span aria-hidden="true">ᚺ</span> : null}
                    <span className="hws-tab-title">{tab.title}</span>
                    {dirty.has(tab.id) && <span className="hws-tab-dirty" title={t("unsavedMark")} aria-label={t("unsavedMark")}>●</span>}
                  </button>
                  {!tab.pinned && (
                    <button
                      type="button"
                      className="hws-tab-close"
                      aria-label={t("closeNamed", { title: tab.title })}
                      title={t("closeTab")}
                      data-testid="workspace-tab-close"
                      onClick={() => requestClose(tab)}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {notice && (
            <div className="hws-notice" role="status" data-testid="workspace-notice">
              {notice}
              <button type="button" className="ml-3 underline" onClick={() => setNotice("")}>{t("ok")}</button>
            </div>
          )}

          <div className="hws-panels">
            <section
              id={`hws-panel-${HOME_TAB_ID}`}
              role="tabpanel"
              aria-labelledby={`hws-tab-${HOME_TAB_ID}`}
              hidden={workspace.activeId !== HOME_TAB_ID}
              className="hws-panel"
            >
              <StudioHome {...homeHandlers} lastEditor={lastEditor} />
            </section>

            {workspace.tabs.filter(tab => !tab.pinned).map(tab => (
              <section
                key={tab.id}
                id={`hws-panel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`hws-tab-${tab.id}`}
                hidden={workspace.activeId !== tab.id}
                className="hws-panel"
                data-mounted={mounted.has(tab.id) ? "yes" : "no"}
              >
                {mounted.has(tab.id) && <StudioPane
                  tabId={tab.id}
                  location={tab.location}
                  intent={tab.intent}
                  active={workspace.activeId === tab.id}
                  onLocationChange={handleLocationChange}
                  onOpenTab={open}
                  onGoHome={goHome}
                  onDirtyChange={handleDirtyChange}
                />}
              </section>
            ))}
          </div>
        </main>

        <div
          className="hws-resizer"
          role="separator"
          aria-orientation="vertical"
          aria-label={t("resizeAssistant")}
          aria-valuemin={ASSISTANT_MIN}
          aria-valuemax={ASSISTANT_MAX}
          aria-valuenow={layout.assistantWidth}
          tabIndex={layout.assistantOpen ? 0 : -1}
          hidden={!layout.assistantOpen}
          onPointerDown={startResize}
          onKeyDown={resizeByKey}
          data-testid="assistant-resizer"
        />

        <aside id="hws-assistant-panel" className="hws-aside" hidden={!layout.assistantOpen} data-testid="assistant-panel">
          <SpacemonkeyAssistant context={assistantContext} />
        </aside>
      </div>

      {closing && (
        <TabCloseDialog
          tab={closing}
          onCancel={() => setClosing(null)}
          onConfirm={() => {
            forgetTab(closing.id)
            setClosing(null)
          }}
        />
      )}
    </div>
  )
}

export default HearthwoodStudio
