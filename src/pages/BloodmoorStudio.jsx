import { useState } from "react"

import DoctorPanel from "../components/bloodmoor-studio/DoctorPanel"
import EntityBrowser from "../components/bloodmoor-studio/EntityBrowser"
import NlChangeBox from "../components/bloodmoor-studio/NlChangeBox"
import PatchHistoryList from "../components/bloodmoor-studio/PatchHistoryList"
import SheetView from "../components/bloodmoor-studio/SheetView"

/*
 * Bloodmoor Studio - its own Dev Studio for Bloodmoor, a standalone
 * game project separate from Wood-Booster-OS/Hearthwood. Deliberately
 * NOT sharing hearthwood-studio's components: Marc asked for a CRUD/
 * patch tool built specifically for Bloodmoor (2026-09-19), not a
 * shared multi-project system bolted onto Hearthwood's Patchbay.
 *
 * v1 scope: balance.js's 8 exported settings objects (weapons, boss,
 * elite modifiers, enemy base stats, spawner curve, player base stats,
 * leveling curve, weapon drop chances) - the numbers pulled out of
 * engine code specifically to make this possible. Game engine code
 * (main.js, entities.js, ...) stays a normal "ask Claude" task; the
 * risk model (riskModel.js) refuses to live-apply anything that
 * touches it.
 *
 * Sheet view (spreadsheet-style bulk edit) is always shown for the
 * selected type; the NL box on the right targets whichever single
 * entity is selected in the browser. No live-preview iframe in this
 * pass - Bloodmoor's own dev server (already running separately) picks
 * up an applied change via its own HMR once it's written to disk.
 */
function BloodmoorStudio() {
  const [entityType, setEntityType] = useState("weapons")
  const [entityId, setEntityId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [historyKey, setHistoryKey] = useState(0)

  function handleTypeChange(nextType) {
    setEntityType(nextType)
    setEntityId(null)
  }

  function handleSelect(type, id) {
    setEntityType(type)
    setEntityId(id)
  }

  function handleApplied() {
    setReloadKey(previous => previous + 1)
    setHistoryKey(previous => previous + 1)
  }

  function handleReverted() {
    setReloadKey(previous => previous + 1)
  }

  return (
    <div className="space-y-6" style={{ "--wood-accent": "#b3253e" }}>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--wood-accent)]">
          Boosterverse
        </p>

        <h1 className="mt-2 text-4xl font-bold text-[var(--wood-text)]">
          🩸 Bloodmoor Studio
        </h1>

        <p className="mt-3 max-w-3xl text-[var(--wood-muted)]">
          Browse Bloodmoor's balance numbers, edit a whole sheet at once or tell it what you
          want changed in plain language, review the diff, and apply only after confirming.
          Every applied change is revertible.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_360px]">
        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <EntityBrowser type={entityType} onTypeChange={handleTypeChange} selectedId={entityId} onSelect={handleSelect} />
        </section>

        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <SheetView key={`${entityType}-${reloadKey}`} type={entityType} onApplied={handleApplied} />
        </section>

        <section className="h-[620px] rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-y-auto wood-scroll p-5">
          <NlChangeBox
            type={entityType}
            entityId={entityId}
            entityLabel={entityId ? `${entityType}/${entityId}` : null}
            onApplied={handleApplied}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] overflow-hidden">
          <div className="border-b border-[var(--wood-border)] px-5 py-3 text-sm font-semibold text-[var(--wood-text)]">
            History
          </div>

          <div className="h-[420px]">
            <PatchHistoryList reloadKey={historyKey} onReverted={handleReverted} />
          </div>
        </section>

        <DoctorPanel />
      </div>
    </div>
  )
}

export default BloodmoorStudio
