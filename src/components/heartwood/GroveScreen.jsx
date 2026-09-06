import { useState } from "react"
import { META_PERKS } from "../../data/heartwood/metaPerks"

// The Grove - between-run progression (metaState.js / metaPerks.js).
// Marc: "jokainen run vie eteenpäin vaikka hävisi". You carry Acorns
// out of every run, won or lost, and plant them here for permanent
// perks that give the NEXT run a head start. Reached from the
// commander-select screen.
//
// `meta` is metaState.js's shape; `onBuy(perkId)` spends the Acorns and
// adds the perk to meta.chosenPerks (the parent persists it);
// `onBack()` returns to commander select.
export default function GroveScreen({ meta, onBuy, onBack }) {
  const [justBought, setJustBought] = useState(null)
  const owned = new Set(meta.chosenPerks || [])

  return (
    <div className="hw-intro hw-grove">
      <button className="hw-exit-link hw-utility-btn" style={{ position: "absolute", top: 16, left: 16 }} onClick={onBack}>
        ← Back
      </button>

      <div style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--hw-moss)", marginBottom: 4 }}>
        The Grove
      </div>
      <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Plant what you carried out</h1>
      <p className="hw-flavor" style={{ maxWidth: 560 }}>
        Every run leaves you with Acorns - more the further you got, most of all for a win. Spend them here on
        permanent head starts. What you plant stays planted.
      </p>

      <div className="hw-grove-balance">
        <span className="hw-grove-acorn">&#127807;</span> {meta.acorns} Acorns
        <span className="hw-grove-stats">
          {meta.stats?.runs || 0} runs &middot; {meta.stats?.wins || 0} wins
        </span>
      </div>

      <div className="hw-grove-perks">
        {META_PERKS.map((perk) => {
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
