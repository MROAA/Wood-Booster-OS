import { useEffect, useState } from "react"

import { apiGet } from "../api/client"

import AddDialogueForm from "../components/hearthwood-studio/AddDialogueForm"
import AddEventForm from "../components/hearthwood-studio/AddEventForm"
import AddStoryEntryForm from "../components/hearthwood-studio/AddStoryEntryForm"
import BalancePanel from "../components/hearthwood-studio/BalancePanel"
import CloneEntityForm from "../components/hearthwood-studio/CloneEntityForm"
import Dashboard from "../components/hearthwood-studio/Dashboard"
import DoctorPanel from "../components/hearthwood-studio/DoctorPanel"
import EntityBrowser from "../components/hearthwood-studio/EntityBrowser"
import EntityChangeLog from "../components/hearthwood-studio/EntityChangeLog"
import EntityFieldEditor from "../components/hearthwood-studio/EntityFieldEditor"
import ImageUploadField from "../components/hearthwood-studio/ImageUploadField"
import NlChangeBox from "../components/hearthwood-studio/NlChangeBox"
import LivePreviewPane from "../components/hearthwood-studio/LivePreviewPane"
import PatchHistoryList from "../components/hearthwood-studio/PatchHistoryList"
import SheetView from "../components/hearthwood-studio/SheetView"
import ThemePanel from "../components/hearthwood-studio/ThemePanel"

/*
 * Hearthwood Studio - oma Dev Studio pelille, ei pilleri geneerisellä
 * /dev-studio:lla (Marc 2026-08-30: "luot pelille dev studion
 * patchbaysta"). Vaiheen 1 MVP: entiteettiselain + "omin sanoin"
 * -laatikko + live-esikatselu + historia. Kenttäeditori ja
 * tasapaino/doctor-paneelit ovat Vaiheen 2 laajennuksia
 * (heartwood-patchbay-vast-giraffe.md), ei tässä.
 */
// Marc, 2026-09-20: "haluan jotenkin livenä muokata peliä sitä
// pelatessani... että pelaan peliä ja muokkaan sitä pelatessa... se
// olisi minulle helpoin tapa tehdä tarinaa" (I want to somehow edit
// the game live while playing it - play and edit as I go - that would
// be the easiest way for me to make the story). A story screen
// in-game (EventScreen.jsx, DialogueScreen.jsx) carries a small
// EditInStudioLink pointing at `/hearthwood-studio?type=&id=` - read
// once on load so opening that link lands directly on the exact thing
// Marc just saw, instead of the Dashboard he'd have to navigate away
// from by hand.
function deepLinkFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const type = params.get("type")
  const id = params.get("id")

  return type && id ? { type, id } : null
}

function HearthwoodStudio() {
  const deepLink = deepLinkFromUrl()

  const [viewMode, setViewMode] = useState(deepLink ? "single" : "dashboard")
  // `browsingType` drives what the LEFT panel shows; `entityType` drives
  // what the DETAIL panel fetches. Normally the same value - split only
  // matters for the Story Timeline (Marc: "en tiedä missä jaotellut
  // paikat on" - a cross-type chronological list), where clicking a row
  // whose real type is e.g. "events" must open THAT entity in the
  // detail panel without silently kicking the left panel back to a
  // flat per-type list and losing the chronological browsing context.
  const [browsingType, setBrowsingType] = useState(deepLink?.type || "enemies")
  const [entityType, setEntityType] = useState(deepLink?.type || "enemies")
  const [entityId, setEntityId] = useState(deepLink?.id || null)
  const [entityDetail, setEntityDetail] = useState(null)
  const [entityLoading, setEntityLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [historyKey, setHistoryKey] = useState(0)

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
  }, [entityType, entityId])

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

    // Stay on the Story Timeline after picking a row - its rows span
    // several real types, so syncing browsingType here would bounce
    // back to a flat per-type list after every single click.
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

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--wood-accent)]">
          Boosterverse
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[var(--wood-text)]">
          🜏 Hearthwood Studio
        </h1>

        <p className="mt-3 max-w-3xl text-[var(--wood-muted)]">
          Browse the game's content, describe what you want to change in your own words, review the
          proposed diff, and apply only after you approve it. Every change is one click away from being reverted.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("dashboard")}
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
            onClick={() => setViewMode("single")}
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
            onClick={() => setViewMode("sheet")}
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
            onClick={() => setViewMode("theme")}
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
        </div>
      </header>

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

            <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
              <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
            </section>
          </div>
        )
      }

      {viewMode !== "theme" && viewMode !== "dashboard" && (
      <div className={`grid grid-cols-1 gap-4 ${viewMode === "single" ? "lg:grid-cols-[260px_1fr_360px]" : "lg:grid-cols-[260px_1fr]"}`}>
        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <EntityBrowser
            type={browsingType}
            onTypeChange={handleTypeChange}
            selectedId={entityId}
            onSelect={handleSelect}
            onAddNew={handleAddNew}
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
                        type={entityType}
                        onApplied={handleApplied}
                        onPreviewUrlChange={setPreviewUrl}
                      />
                    )
                  }

                  {
                    entityType === "dialogues" && (
                      <AddDialogueForm
                        type={entityType}
                        onApplied={handleApplied}
                        onPreviewUrlChange={setPreviewUrl}
                      />
                    )
                  }

                  {
                    !entityId && (
                      <div className="text-sm text-[var(--wood-muted)]">
                        Select an entity on the left to get started.
                      </div>
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
                        <div className="text-sm font-semibold text-[var(--wood-text)]">
                          {entityDetail.name || entityDetail.id}
                        </div>

                        <CloneEntityForm
                          type={entityType}
                          entityId={entityId}
                          entityDetail={entityDetail}
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
                      </div>
                    )
                  }

                  {
                    entityId && !entityLoading && (
                      <EntityChangeLog entityId={entityId} reloadKey={reloadKey} />
                    )
                  }

                  <NlChangeBox
                    type={entityType}
                    entityId={entityId}
                    entityLabel={entityDetail?.name}
                    onApplied={handleApplied}
                    onPreviewUrlChange={setPreviewUrl}
                  />
                </section>

                <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
                  <LivePreviewPane previewUrl={previewUrl} reloadKey={reloadKey} />
                </section>
              </>
            )
        }
      </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <div className="border-b border-[var(--wood-border)] px-5 py-3 text-sm font-semibold text-[var(--wood-text)]">
            History
          </div>

          <div className="h-[420px]">
            <PatchHistoryList reloadKey={historyKey} onReverted={handleReverted} />
          </div>
        </section>

        <div className="space-y-4">
          <DoctorPanel />
          <BalancePanel />
        </div>
      </div>
    </div>
  )
}

export default HearthwoodStudio
