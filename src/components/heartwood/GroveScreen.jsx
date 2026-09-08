import { useState } from "react"
import { META_PERKS } from "../../data/heartwood/metaPerks"
import { DEPTHS, MAX_DEPTH, depthModifiersFor, depthAcornMultiplier } from "../../data/heartwood/depths"

// The Grove - between-run progression (metaState.js / metaPerks.js).
// Marc: "jokainen run vie eteenpäin vaikka hävisi". You carry Acorns
// out of every run, won or lost, and plant them here for permanent
// perks that give the NEXT run a head start. Reached from the
// commander-select screen.
//
// `meta` is metaState.js's shape; `onBuy(perkId)` spends the Acorns and
// adds the perk to meta.chosenPerks (the parent persists it);
// `onBack()` returns to commander select.
export default function GroveScreen({ meta, onBuy, onSelectDepth, onBack }) {
  const [justBought, setJustBought] = useState(null)
  const owned = new Set(meta.chosenPerks || [])
  const unlockedDepth = meta.depth || 0
  const selectedDepth = Math.max(0, Math.min(unlockedDepth, meta.selectedDepth || 0))
  const activeMods = depthModifiersFor(selectedDepth).active

  // Buyable-and-affordable first, then buyable-but-too-dear, then
  // already planted - so the next thing you can actually do is at the top.
  const rank = (p) => (owned.has(p.id) ? 2 : meta.acorns >= p.cost ? 0 : 1)
  const perks = [...META_PERKS].sort((a, b) => rank(a) - rank(b) || a.cost - b.cost)

  return (
    <div className="hw-intro hw-grove hw-screen-frame">
      <button className="hw-exit-link hw-utility-btn" style={{ position: "absolute", top: 16, left: 16 }} onClick={onBack}>
        ← Back
      </button>

      <div className="hw-screen-eyebrow">The Grove</div>
      <h1 className="hw-screen-title">Plant what you carried out</h1>
      <p className="hw-flavor" style={{ maxWidth: 560 }}>
        Every run leaves you with Acorns - more the further you got, most of all for a win. Spend them here on
        permanent head starts. What you plant stays planted.
      </p>

      <div className="hw-grove-balance">
        <span className="hw-grove-acorn">&#127807;</span> {meta.acorns} Acorns
        <span className="hw-grove-stats">
          {owned.size} / {META_PERKS.length} planted &middot; {meta.stats?.runs || 0} runs &middot; {meta.stats?.wins || 0} wins
        </span>
      </div>

      {/* Depths (depths.js) - the challenge ladder. Only shows once the
          player has unlocked at least Depth I by winning a run. */}
      {(unlockedDepth > 0 || selectedDepth > 0) && (
        <div className="hw-grove-depths">
          <div className="hw-grove-section-label">Depths — next run</div>
          <div className="hw-grove-depth-row">
            <button
              className="hw-grove-depth-step"
              disabled={selectedDepth <= 0}
              onClick={() => onSelectDepth(selectedDepth - 1)}
              aria-label="Lower Depth"
            >
              −
            </button>
            <span className="hw-grove-depth-value">
              {selectedDepth === 0 ? "Depth 0 — the base trial" : `Depth ${selectedDepth} — ${DEPTHS[selectedDepth - 1]?.name}`}
              <span className="hw-grove-depth-payout"> · Acorns ×{depthAcornMultiplier(selectedDepth).toFixed(1)}</span>
            </span>
            <button
              className="hw-grove-depth-step"
              disabled={selectedDepth >= unlockedDepth}
              onClick={() => onSelectDepth(selectedDepth + 1)}
              aria-label="Higher Depth"
            >
              +
            </button>
          </div>
          {activeMods.length > 0 && (
            <ul className="hw-grove-depth-mods">
              {activeMods.map((d) => (
                <li key={d.level}>
                  <strong>Depth {d.level}:</strong> {d.description}
                </li>
              ))}
            </ul>
          )}
          {unlockedDepth < MAX_DEPTH && (
            <p className="hw-grove-depth-hint">
              Win a run at Depth {unlockedDepth} to unlock Depth {unlockedDepth + 1}.
            </p>
          )}
        </div>
      )}

      <div className="hw-grove-perks">
        {perks.map((perk) => {
          const isOwned = owned.has(perk.id)
          const canAfford = meta.acorns >= perk.cost
          return (
            <button
              key={perk.id}
              className={`hw-grove-perk${isOwned ? " is-owned" : ""}${justBought === perk.id ? " is-fresh" : ""}`}
              disabled={isOwned || !canAfford}
              onClick={() => {
                onBuy(perk.id)
                setJustBought(perk.id)
              }}
            >
              <div className="hw-grove-perk-head">
                <span className="hw-grove-perk-name">{perk.name}</span>
                <span className="hw-grove-perk-cost">
                  {isOwned ? "Planted" : `${perk.cost} \u{1F33F}`}
                </span>
              </div>
              <div className="hw-grove-perk-desc">{perk.description}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
