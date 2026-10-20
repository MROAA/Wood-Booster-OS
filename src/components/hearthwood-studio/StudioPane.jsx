import { useEffect, useMemo, useRef, useState } from "react"

import { apiGet } from "../../api/client"

import AddCrossroadsForm from "./AddCrossroadsForm"
import AddBattleObjectForm from "./AddBattleObjectForm"
import AddDialogueForm from "./AddDialogueForm"
import AddEventForm from "./AddEventForm"
import AddStoryEntryForm from "./AddStoryEntryForm"
import BalancePanel from "./BalancePanel"
import CloneEntityForm from "./CloneEntityForm"
import Dashboard from "./Dashboard"
import DoctorPanel from "./DoctorPanel"
import EntityBrowser from "./EntityBrowser"
import EntityChangeLog from "./EntityChangeLog"
import EntityFieldEditor from "./EntityFieldEditor"
import ImageUploadField from "./ImageUploadField"
import NlChangeBox from "./NlChangeBox"
import LivePreviewPane from "./LivePreviewPane"
import PatchHistoryList from "./PatchHistoryList"
import SheetView from "./SheetView"
import ThemePanel from "./ThemePanel"
import ResourceEditor from "./ResourceEditor"
import MutationEditor from "./MutationEditor"
import { TraitEditor, PromotionEditor, HeroIdentityEditor } from "./HeroDataEditor"
import GearEditor from "./GearEditor"
import StoryMap from "./StoryMap"
import SkillWorkshop from "./SkillWorkshop"
import CardGallery from "./CardGallery"
import { plainName } from "./plainWords"
import { labelFor } from "./entityTypes"
import StoryWriter, { STORY_WRITER_TYPES } from "./StoryWriter"
import { roomById, roomForType } from "./studioRooms"
import { TOOL_VIEWS, urlForLocation } from "./workspaceTabs"
import { roomTitle, t } from "./studioText"
import { UnsavedWorkProvider, createUnsavedTracker } from "./unsavedWork"

/*
 * One workspace tab of the Hearthwood Dev Studio. Sprint 4: the editors
 * that used to share one page now each live in their own tab, so several
 * stay open at once without losing what is open in the others.
 * This is the former HearthwoodStudio page body, moved here unchanged
 * except that it: starts from its tab's `location` instead of the address
 * bar; opens other editors as tabs (onOpenTab); reports where it is
 * (onLocationChange) and whether it holds unsaved work (onDirtyChange);
 * and only the ACTIVE tab writes the address bar.
 * Page history kept: Marc 2026-08-30 "luot pelille dev studion
 * patchbaysta"; 2026-09-20 in-game EditInStudioLink deep links
 * `/hearthwood-studio?type=&id=` (now workspaceTabs.locationFromUrl).
 */

// Story entries open in the Story Writer; their raw fields fold away.
function AdvancedFold({ fold, children }) {
  if (!fold) return <>{children}</>
  return (
    <details className="rounded-lg border border-[var(--wood-border)] p-2" data-testid="all-fields-fold">
      <summary className="cursor-pointer text-xs text-[var(--wood-muted)]">All fields (advanced)</summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  )
}

const navClass = active => `
  rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
  ${active ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]" : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"}
`

function StudioPane({ tabId, location, intent = 0, active, onLocationChange, onOpenTab, onGoHome, onDirtyChange }) {
  const [viewMode, setViewMode] = useState(location.view)
  // Hearthwood HQ (studioRooms.js): the room you're in limits the left
  // list to that room's things; null = every list ("More tools").
  const [room, setRoom] = useState(() => roomById(location.roomId) || (location.type ? roomForType(location.type) : null))
  const [roomHint, setRoomHint] = useState(location.hint || "")
  // An HQ "add" button opens that type's compose form already open; the
  // nonce re-mounts it so pressing the button again re-opens it.
  const [compose, setCompose] = useState({ type: location.composeType || null, nonce: location.composeType ? 1 : 0 })
  // An HQ wish that is a change: its words pre-fill the AI box.
  const [wishText, setWishText] = useState({ text: location.wishText || "", nonce: 0 })
  // The old tab row (Single / Sheet / Mutations / ...) lives behind this.
  const [showMoreTools, setShowMoreTools] = useState(location.view === "sheet")
  // `browsingType` drives what the LEFT panel shows; `entityType` drives
  // what the DETAIL panel fetches. Normally the same value - split only
  // matters for the Story Timeline (Marc: "en tiedä missä jaotellut
  // paikat on" - a cross-type chronological list), where clicking a row
  // whose real type is e.g. "events" must open THAT entity in the
  // detail panel without silently kicking the left panel back to a
  // flat per-type list and losing the chronological browsing context.
  const [browsingType, setBrowsingType] = useState(location.type || "enemies")
  const [entityType, setEntityType] = useState(location.type || "enemies")
  const [entityId, setEntityId] = useState(location.id || null)
  const [entityDetail, setEntityDetail] = useState(null)
  const [entityLoading, setEntityLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  // The live game panel takes a third of the screen and mostly shows the
  // title screen - hidden until asked for, or while a change is previewed.
  const [showGame, setShowGame] = useState(false)
  // Marc, 2026-10-19: "live game ei ole mielestäni tärkeä" - off
  // everywhere; only "More tools" offers it.
  const gameVisible = showMoreTools && showGame
  // usePatchPreview reads this to decide whether to start the sandbox game.
  useEffect(() => {
    if (active) window.__hwStudioLiveGame = gameVisible || viewMode === "theme"
  }, [active, gameVisible, viewMode])
  const [reloadKey, setReloadKey] = useState(0)
  const [historyKey, setHistoryKey] = useState(0)
  // Set only by the entity list's own "+ Add new" button - tells
  // CloneEntityForm (keyed by entityId below) to open itself pre-filled
  // immediately instead of the normal collapsed "⧉ Clone as new"
  // toggle. Cleared on any ordinary selection so navigating to a
  // DIFFERENT entity afterward doesn't leave a stale auto-open behind.
  const [autoOpenCloneId, setAutoOpenCloneId] = useState(null)

  useEffect(() => {
    if (!entityId) {
      setEntityDetail(null)
      return
    }

    let cancelled = false

    async function load() {
      setEntityLoading(true)

      try {
        const data = await apiGet(`/hearthwood-patchbay/entity/${entityType}/${entityId}`)

        if (!cancelled) {
          setEntityDetail(data)
        }
      } catch {
        if (!cancelled) {
          setEntityDetail(null)
        }
      } finally {
        if (!cancelled) {
          setEntityLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // reloadKey: refetch after a save / a data file change (no page reload any more).
  }, [entityType, entityId, reloadKey])

  function handleTypeChange(nextType) {
    setBrowsingType(nextType)
    setEntityType(nextType)
    setEntityId(null)
    setPreviewUrl(null)
  }

  function handleSelect(type, id) {
    setEntityType(type)
    setEntityId(id)
    setPreviewUrl(null)
    setAutoOpenCloneId(null)

    // Stay on the Story Timeline after picking a row - its rows span
    // several real types, so syncing browsingType here would bounce
    // back to a flat per-type list after every single click.
    if (browsingType !== "storyTimeline") {
      setBrowsingType(type)
    }
  }

  // The entity list's own "+ Add new" button - clones whichever entity
  // it's given (the list's own first entry) and lands directly on that
  // entity's Clone form, already open. See CloneEntityForm.jsx's own
  // `autoOpen` comment for why Marc needed this at all.
  function handleCreateNew(type, baseId) {
    setEntityType(type)
    setEntityId(baseId)
    setPreviewUrl(null)
    setAutoOpenCloneId(baseId)

    if (browsingType !== "storyTimeline") {
      setBrowsingType(type)
    }
  }

  // Story Timeline's own "+ New Event/Dialogue/Journal Entry" row -
  // switches the detail panel to that type's existing compose form
  // (AddEventForm/AddDialogueForm/AddStoryEntryForm, all rendered
  // below whenever entityType matches) without leaving the Timeline
  // itself: browsingType deliberately stays untouched, same reasoning
  // as handleSelect's own "stay on the Story Timeline" comment. Forces
  // viewMode to "single" since the compose forms only render there
  // (Sheet/Dashboard/Theme have no such slot) - clicking one of these
  // buttons from Sheet view otherwise did nothing visible.
  function handleAddNew(type) {
    setEntityType(type)
    setEntityId(null)
    setPreviewUrl(null)
    setViewMode("single")
  }

  function handleApplied() {
    setReloadKey(previous => previous + 1)
    setHistoryKey(previous => previous + 1)
  }

  // Dashboard's own two "take me there" actions - both land in Single
  // view, the one place that actually shows a picked entity's own editor.
  function handleNavigateFromDashboard(type) {
    handleTypeChange(type)
    setViewMode("single")
  }

  function handleSelectFromDashboard(type, id) {
    handleSelect(type, id)
    setViewMode("single")
  }

  function handleReverted() {
    setReloadKey(previous => previous + 1)
  }

  // Where this tab is now: the tab strip shows it, storage restores it,
  // and the ACTIVE tab keeps it in the address bar (Marc: F5 must come
  // back to the same place, not the HQ home).
  const here = useMemo(() => ({
    view: viewMode,
    ...(room ? { roomId: room.id } : {}),
    ...(viewMode === "single" || viewMode === "sheet" ? { type: entityType } : {}),
    ...(viewMode === "single" && entityId ? { id: entityId } : {}),
  }), [viewMode, room, entityType, entityId])
  const title = viewMode === "single"
    ? (entityId && entityDetail ? plainName(entityDetail, labelFor(entityType)) : labelFor(entityType))
    : viewMode === "sheet" ? `${labelFor(entityType)} sheet` : TOOL_VIEWS[viewMode]

  useEffect(() => {
    onLocationChange?.(tabId, here, title)
  }, [tabId, here, title, onLocationChange])

  useEffect(() => {
    if (!active) return
    const next = `${window.location.pathname}${urlForLocation(here)}`
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next)
  }, [active, here])

  // Unsaved work inside this tab (usePatchPreview reports pending previews).
  const dirtyRef = useRef(onDirtyChange)
  dirtyRef.current = onDirtyChange
  const unsavedTracker = useMemo(() => createUnsavedTracker(dirty => dirtyRef.current?.(tabId, dirty)), [tabId])

  // A game data file changed (vite.config.js hearthwoodDataHmr): refresh, don't reload.
  useEffect(() => {
    const onDataChanged = () => setReloadKey(previous => previous + 1)
    window.addEventListener("hw-data-changed", onDataChanged)
    return () => window.removeEventListener("hw-data-changed", onDataChanged)
  }, [])

  // --- Hearthwood HQ ---------------------------------------------------
  function goHome() {
    onGoHome?.()
  }

  function runRoomAction(nextRoom, action) {
    setRoom(nextRoom)
    setRoomHint(action.hint || "")
    if (action.kind === "link") {
      window.open(action.href, "_blank", "noopener")
      return
    }
    if (action.kind === "view") {
      setViewMode(action.view)
      return
    }
    setBrowsingType(action.type)
    setPreviewUrl(null)
    if (action.kind === "add") {
      handleAddNew(action.type)
      setCompose(previous => ({ type: action.type, nonce: previous.nonce + 1 }))
      return
    }
    setCompose(previous => ({ ...previous, type: null }))
    handleTypeChange(action.type)
    setViewMode("single")
  }

  // A "More tools" editor opens in its own workspace tab (or re-uses it).
  function openTool(view) {
    onOpenTab?.({ view, ...(view === "single" || view === "sheet" ? { type: entityType } : {}) })
  }

  async function createFromFirst(type) {
    try {
      const data = await apiGet(`/hearthwood-patchbay/entities?type=${type}`)
      const first = data.entities?.[0]
      if (first) {
        handleCreateNew(type, first.id)
        setViewMode("single")
      }
    } catch {
      handleTypeChange(type)
      setViewMode("single")
    }
  }

  // The tab was (re-)opened from Studio Home with a request - a room
  // action, a wish, "make a new", "clone": apply it here. The first run
  // only handles "clone" (the state above already starts from location).
  const firstIntent = useRef(true)
  useEffect(() => {
    if (firstIntent.current) {
      firstIntent.current = false
      if (location.cloneFirst) createFromFirst(location.type)
      return
    }
    setViewMode(location.view)
    if (location.roomId || location.type) setRoom(roomById(location.roomId) || roomForType(location.type))
    setRoomHint(location.hint || "")
    if (location.type) {
      setBrowsingType(location.type)
      setEntityType(location.type)
      setEntityId(location.id || null)
      setPreviewUrl(null)
    }
    if (location.composeType) setCompose(previous => ({ type: location.composeType, nonce: previous.nonce + 1 }))
    if (location.wishText) setWishText(previous => ({ text: location.wishText, nonce: previous.nonce + 1 }))
    if (location.cloneFirst) createFromFirst(location.type)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per new request (intent)
  }, [intent])

  return (
    <UnsavedWorkProvider value={unsavedTracker}>
    <div className="hws-pane space-y-4" data-testid="studio-pane" data-view={viewMode}>
      <header className="hws-pane-toolbar space-y-3">
        <nav className="flex flex-wrap items-center justify-end gap-2" data-testid="studio-nav">
          <button type="button" onClick={() => openTool("dashboard")} data-testid="studio-nav-find" className={navClass(viewMode === "dashboard")}>🔎 {TOOL_VIEWS.dashboard}</button>
          <button type="button" onClick={() => openTool("history")} data-testid="studio-nav-undo" className={navClass(viewMode === "history")}>↩ {TOOL_VIEWS.history}</button>
          <button type="button" onClick={() => setShowMoreTools(previous => !previous)} data-testid="studio-nav-more" className={navClass(showMoreTools)}>⚙ {t("moreTools")}</button>
        </nav>

        {
          room && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] px-4 py-2" data-testid="studio-room-bar">
              <button type="button" onClick={goHome} className="text-sm text-[var(--wood-muted)] hover:text-[var(--wood-text)]">{t("homeTab")}</button>
              <span className="text-[var(--wood-muted)]">›</span>
              <span className="text-sm font-semibold text-[var(--wood-text)]"><span className="mr-1 text-[var(--wood-accent)]">{room.rune}</span>{roomTitle(room)}</span>
              <span className="mx-2 h-4 w-px bg-[var(--wood-border)]" />
              {
                room.actions.map(action => (
                  <button key={action.label} type="button" onClick={() => runRoomAction(room, action)} className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-text)] hover:border-[var(--wood-accent)]">
                    {action.label}
                  </button>
                ))
              }
              {roomHint && <span className="w-full text-xs text-[var(--wood-accent)]">{roomHint}</span>}
            </div>
          )
        }

        {showMoreTools && (
        <div className="mt-3 flex flex-wrap gap-2" data-testid="studio-more-tools">
          <button
            type="button"
            onClick={() => openTool("dashboard")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "dashboard"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            🏠 Dashboard
          </button>

          <button
            type="button"
            onClick={() => openTool("single")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "single"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            Single
          </button>

          <button
            type="button"
            onClick={() => openTool("sheet")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "sheet"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            Sheet
          </button>

          <button
            type="button"
            onClick={() => openTool("theme")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "theme"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            🎨 Colors & Theme
          </button>

          <button
            type="button"
            data-testid="studio-resources-tab"
            onClick={() => openTool("resources")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "resources"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            ⚡ Hero Resources
          </button>

          <button
            type="button"
            data-testid="studio-mutations-tab"
            onClick={() => openTool("mutations")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "mutations"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            🧬 Mutations
          </button>

          <button
            type="button"
            data-testid="studio-traits-tab"
            onClick={() => openTool("traits")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "traits"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            🍀 Traits
          </button>

          <button
            type="button"
            data-testid="studio-promotions-tab"
            onClick={() => openTool("promotions")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "promotions"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            ⚜ Promotions
          </button>

          <button
            type="button"
            data-testid="studio-identity-tab"
            onClick={() => openTool("identity")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "identity"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            ✨ Hero Identity
          </button>

          <button
            type="button"
            data-testid="studio-gear-tab"
            onClick={() => openTool("gear")}
            className={`
              rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
              ${
                viewMode === "gear"
                  ? "border-[var(--wood-accent)] bg-[var(--wood-accent)] text-[#17120c]"
                  : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:text-[var(--wood-text)]"
              }
            `}
          >
            🎒 Gear
          </button>
        </div>
        )}
      </header>

      {
        // Testing & QA (Sprint 4): the Studio's real checks in one place -
        // the data/tool health check, the balance test, and each change's
        // own automatic check (its status in the list). Nothing invented.
        viewMode === "qa" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" data-testid="studio-qa">
            <div className="space-y-4">
              <DoctorPanel />
              <BalancePanel />
            </div>
            <section className="rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <div className="border-b border-[var(--wood-border)] px-5 py-3 text-sm font-semibold text-[var(--wood-text)]">
                Each change's automatic check
              </div>
              <div className="h-[520px]">
                <PatchHistoryList reloadKey={historyKey} onReverted={handleReverted} />
              </div>
            </section>
          </div>
        )
      }

      {
        viewMode === "skills" && <SkillWorkshop onApplied={handleApplied} reloadKey={reloadKey} />
      }

      {
        viewMode === "storyMap" && (
          <StoryMap
            onOpen={(type, id) => {
              setRoom(roomById("story"))
              setRoomHint("")
              handleSelect(type, id)
              setBrowsingType(type)
              setViewMode("single")
            }}
          />
        )
      }

      {
        viewMode === "dashboard" && (
          <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
            <Dashboard onNavigate={handleNavigateFromDashboard} onSelectEntity={handleSelectFromDashboard} />
          </section>
        )
      }

      {
        viewMode === "theme" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <ThemePanel onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
            </section>

            {/* colours are the one place where seeing the game helps */}
            {(
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
            </section>
            )}
          </div>
        )
      }

      {
        viewMode === "resources" && (
          <div className={`grid grid-cols-1 gap-4 ${gameVisible ? "lg:grid-cols-[1fr_360px]" : ""}`}>
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <ResourceEditor onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
            </section>

            {gameVisible && (
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
            </section>
            )}
          </div>
        )
      }

      {
        viewMode === "mutations" && (
          <div className={`grid grid-cols-1 gap-4 ${gameVisible ? "lg:grid-cols-[1fr_360px]" : ""}`}>
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <MutationEditor onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
            </section>

            {gameVisible && (
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
            </section>
            )}
          </div>
        )
      }

      {
        (viewMode === "traits" || viewMode === "promotions" || viewMode === "identity") && (
          <div className={`grid grid-cols-1 gap-4 ${gameVisible ? "lg:grid-cols-[1fr_360px]" : ""}`}>
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              {viewMode === "identity" ? (
                <HeroIdentityEditor onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
              ) : viewMode === "traits" ? (
                <TraitEditor onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
              ) : (
                <PromotionEditor onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
              )}
            </section>

            {gameVisible && (
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
            </section>
            )}
          </div>
        )
      }

      {
        viewMode === "gear" && (
          <div className={`grid grid-cols-1 gap-4 ${gameVisible ? "lg:grid-cols-[1fr_360px]" : ""}`}>
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <GearEditor onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
            </section>

            {gameVisible && (
            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
            </section>
            )}
          </div>
        )
      }

      {showMoreTools && viewMode !== "history" && viewMode !== "dashboard" && viewMode !== "qa" && (
        <div className="-mb-2 flex justify-end">
          <button type="button" onClick={() => setShowGame(open => !open)} data-testid="studio-toggle-game" className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-muted)] hover:text-[var(--wood-text)]">
            {gameVisible ? "Hide the game" : "▶ Show the game next to it"}
          </button>
        </div>
      )}
      {viewMode !== "history" && viewMode !== "qa" && viewMode !== "storyMap" && viewMode !== "skills" && viewMode !== "theme" && viewMode !== "dashboard" && viewMode !== "resources" && viewMode !== "mutations" && viewMode !== "gear" && viewMode !== "traits" && viewMode !== "promotions" && viewMode !== "identity" && (
      <div className={`grid grid-cols-1 gap-4 ${viewMode === "single" && gameVisible ? "lg:grid-cols-[260px_1fr_360px]" : "lg:grid-cols-[260px_1fr]"}`}>
        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <EntityBrowser
            type={browsingType}
            onTypeChange={handleTypeChange}
            selectedId={entityId}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
            onCreateNew={handleCreateNew}
            allowedTypes={room ? room.types : null}
            reloadKey={reloadKey}
            showIds={showMoreTools}
          />
        </section>

        {
          viewMode === "sheet"
            ? (
              <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
                {
                  browsingType === "storyTimeline"
                    ? (
                      <div className="p-5 text-sm text-[var(--wood-muted)]">
                        Switch to Single view to browse the Story Timeline - it spans several types, so there's no one sheet to show.
                      </div>
                    )
                    : <SheetView type={entityType} onApplied={handleApplied} onPreviewUrlChange={setPreviewUrl} />
                }
              </section>
            )
            : (
              <>
                <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-y-auto wood-scroll p-5 space-y-4">
                  {
                    entityType === "storyJournal" && (
                      <AddStoryEntryForm
                        type={entityType}
                        onApplied={handleApplied}
                        onPreviewUrlChange={setPreviewUrl}
                      />
                    )
                  }

                  {
                    entityType === "events" && (
                      <AddEventForm
                        key={`events-${compose.nonce}`}
                        autoOpen={compose.type === "events"}
                        type={entityType}
                        onApplied={handleApplied}
                        onPreviewUrlChange={setPreviewUrl}
                      />
                    )
                  }

                  {
                    entityType === "dialogues" && (
                      <AddDialogueForm
                        key={`dialogues-${compose.nonce}`}
                        autoOpen={compose.type === "dialogues"}
                        type={entityType}
                        onApplied={handleApplied}
                        onPreviewUrlChange={setPreviewUrl}
                      />
                    )
                  }

                  {
                    entityType === "battleObjects" && (
                      <AddBattleObjectForm
                        key={`battleObjects-${compose.nonce}`}
                        autoOpen={compose.type === "battleObjects"}
                        type={entityType}
                        onApplied={handleApplied}
                        onPreviewUrlChange={setPreviewUrl}
                      />
                    )
                  }

                  {
                    entityType === "crossroads" && (
                      <AddCrossroadsForm
                        type={entityType}
                        onApplied={handleApplied}
                        onPreviewUrlChange={setPreviewUrl}
                      />
                    )
                  }

                  {
                    // No entry picked: the whole list as picture cards (Marc is a visual person).
                    !entityId && entityType !== "storyTimeline" && (
                      <CardGallery type={entityType} onSelect={handleSelect} reloadKey={reloadKey} />
                    )
                  }

                  {
                    entityId && entityLoading && (
                      <div className="text-sm text-[var(--wood-muted)]">Loading...</div>
                    )
                  }

                  {
                    entityId && entityDetail && (
                      <div className="rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="hws-display text-2xl font-semibold text-[var(--wood-text)]" data-testid="entity-title">
                            {plainName(entityDetail, labelFor(entityType))}
                          </div>
                          <button type="button" onClick={() => setEntityId(null)} data-testid="back-to-cards" className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]">
                            ▦ Back to all cards
                          </button>
                        </div>

                        {
                          STORY_WRITER_TYPES.has(entityType) && (
                            <StoryWriter
                              type={entityType}
                              entityId={entityId}
                              entityDetail={entityDetail}
                              onSelect={handleSelect}
                              onApplied={handleApplied}
                              onPreviewUrlChange={setPreviewUrl}
                            />
                          )
                        }

                        <AdvancedFold fold={STORY_WRITER_TYPES.has(entityType)}>
                        {/* Picture first (Marc: hero pictures are the first thing he changes). */}
                        {
                          (entityDetail.identifierKeys || []).map(fieldName => (
                            <ImageUploadField
                              key={fieldName}
                              type={entityType}
                              entityId={entityId}
                              fieldName={fieldName}
                              currentImagePath={entityDetail.fields?.[fieldName]?.value}
                              onApplied={handleApplied}
                              onPreviewUrlChange={setPreviewUrl}
                            />
                          ))
                        }

                        <CloneEntityForm
                          key={entityId}
                          type={entityType}
                          entityId={entityId}
                          entityDetail={entityDetail}
                          autoOpen={entityId === autoOpenCloneId}
                          onApplied={handleApplied}
                          onPreviewUrlChange={setPreviewUrl}
                        />

                        <EntityFieldEditor
                          type={entityType}
                          entityId={entityId}
                          entityDetail={entityDetail}
                          onApplied={handleApplied}
                          onPreviewUrlChange={setPreviewUrl}
                        />
                        </AdvancedFold>

                      </div>
                    )
                  }

                  {
                    entityId && !entityLoading && (
                      <EntityChangeLog entityId={entityId} reloadKey={reloadKey} />
                    )
                  }

                  <NlChangeBox
                    key={`nl-${entityType}-${entityId}-${wishText.nonce}`}
                    initialInstruction={wishText.text}
                    type={entityType}
                    entityId={entityId}
                    entityLabel={entityDetail?.name}
                    onApplied={handleApplied}
                    onPreviewUrlChange={setPreviewUrl}
                  />
                </section>

                {gameVisible && (
                <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
                  <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
                </section>
                )}
              </>
            )
        }
      </div>
      )}

      {(viewMode === "history" || showMoreTools) && (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]" data-testid="studio-history">
        <section className="rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <div className="border-b border-[var(--wood-border)] px-5 py-3 text-sm font-semibold text-[var(--wood-text)]">
            Your changes - press Revert on any of them to undo it
          </div>

          <div className="h-[420px]">
            <PatchHistoryList reloadKey={historyKey} onReverted={handleReverted} />
          </div>
        </section>

        {showMoreTools && (
          <div className="space-y-4">
            <DoctorPanel />
            <BalancePanel />
          </div>
        )}
      </div>
      )}
    </div>
    </UnsavedWorkProvider>
  )
}

export default StudioPane
