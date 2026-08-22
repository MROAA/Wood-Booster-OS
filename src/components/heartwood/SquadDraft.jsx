import { useState } from "react"
import { UNITS, UPGRADE_MAX_LEVEL, upgradeCost } from "../../data/heartwood/units"
import { RELICS } from "../../data/heartwood/relics"
import { CHARACTERS, COMMANDER_RANK_MAX, commanderRankCost } from "../../data/heartwood/characters"
import { REFORGE_COST } from "../../services/heartwood/runEngine"
import UnitCard from "./UnitCard"
import { CardGlyph } from "./cardArt"

// The shop node: recruit whoever you can afford, reroll the rest,
// leave when ready. No forced pick-one - unlike the old card-reward
// screen, a shop lets you walk away empty-handed or buy several.
export default function SquadDraft({
  runState,
  onRecruit,
  onReroll,
  onContinue,
  onUpgrade,
  onRankUp,
  onUpgradeRelic,
  onReforge,
  showIntro,
  onDismissIntro,
}) {
  const offers = runState.shopOffers.map((id) => UNITS[id])
  const commander = CHARACTERS[runState.characterId]
  const commanderRank = runState.commanderRank || 0
  const rankCost = commanderRankCost(commanderRank)
  const [justReforgedKey, setJustReforgedKey] = useState(null)

  function handleReforge(benchKey) {
    onReforge(benchKey)
    setJustReforgedKey(benchKey)
    setTimeout(() => setJustReforgedKey((cur) => (cur === benchKey ? null : cur)), 500)
  }

  return (
    <div className="hw-intro">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>The Heartwood Market</h1>
        <span className="hw-badge hw-essence-badge" title="Essence">
          <CardGlyph name="spark" className="hw-intent-glyph" />
          {runState.essence}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        <span className="hw-badge" title={commander?.description}>
          <CardGlyph name={commander?.art} className="hw-intent-glyph" />
          {commander?.name} · Rank {commanderRank}
        </span>
        {rankCost === null ? (
          <span className="hw-badge" style={{ fontSize: 11 }}>Rank MAX</span>
        ) : (
          <button
            className="hw-move-btn"
            style={{ fontSize: 11, padding: "4px 8px" }}
            disabled={runState.essence < rankCost}
            onClick={onRankUp}
            title={`Permanently strengthen ${commander?.name}'s squad passive (rank ${commanderRank} -> ${commanderRank + 1})`}
          >
            Rank Up ({rankCost} Essence)
          </button>
        )}
      </div>

      {runState.relics.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {runState.relics.map((id) => {
            const level = (runState.relicLevels || {})[id] || 0
            const cost = upgradeCost(level)
            return (
              <span key={id} className="hw-badge" title={RELICS[id]?.description} style={{ gap: 6 }}>
                <CardGlyph name={RELICS[id]?.icon} className="hw-intent-glyph" />
                {RELICS[id]?.name}
                {level > 0 && ` +${level}`}
                {cost === null ? (
                  <span style={{ fontSize: 10, opacity: 0.8 }}>MAX</span>
                ) : (
                  <button
                    className="hw-move-btn"
                    style={{ fontSize: 10, padding: "2px 6px" }}
                    disabled={runState.essence < cost}
                    onClick={() => onUpgradeRelic(id)}
                    title={`Permanently strengthen ${RELICS[id]?.name} (level ${level} -> ${level + 1})`}
                  >
                    Upgrade ({cost})
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      {showIntro && (
        <div className="hw-hint hw-hint--tutorial" style={{ marginTop: 14 }}>
          <span>
            Recruit units, place up to 4 on the grid, then watch them fight automatically. Win to earn Essence and
            press on - lose, and the run ends.
          </span>
          <div className="hw-tutorial-actions">
            <button className="hw-tutorial-next" onClick={onDismissIntro}>
              Got it
            </button>
          </div>
        </div>
      )}

      <p className="hw-flavor" style={{ marginTop: 14 }}>
        Recruit who you can afford, or move on.
      </p>

      <div className="hw-section-label">For sale</div>
      <div className="hw-select-grid hw-deck-preview">
        {offers.map((def) => (
          <UnitCard key={def.id} def={def} disabled={runState.essence < def.recruitCost} onClick={() => onRecruit(def.id)} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
        <button
          className="hw-move-btn"
          disabled={runState.essence < runState.rerollCost || offers.length === 0}
          onClick={onReroll}
        >
          Reroll ({runState.rerollCost} Essence)
        </button>
        <button className="hw-end-turn" onClick={onContinue}>
          Continue
        </button>
      </div>

      <div className="hw-section-label" style={{ marginTop: 20 }}>
        Your bench ({runState.bench.length})
      </div>
      <p style={{ fontSize: 12, color: "var(--hw-muted)", marginTop: -4 }}>
        Spend Essence to permanently strengthen a unit - stacks with fusion, up to {UPGRADE_MAX_LEVEL} times each.
      </p>
      <div className="hw-select-grid hw-deck-preview">
        {runState.bench.map((entry) => {
          const level = entry.upgradeLevel || 0
          const cost = upgradeCost(level)
          const maxed = cost === null
          const def = UNITS[entry.defId]
          const canReforge = def?.displayTier !== 2
          return (
            <div key={entry.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className={justReforgedKey === entry.key ? "hw-card--reforged" : undefined}>
                <UnitCard def={def} disabled />
              </div>
              {level > 0 && (
                <div style={{ fontSize: 11, textAlign: "center", color: "var(--hw-ember)" }}>Upgrade Lv {level}</div>
              )}
              {maxed ? (
                <div className="hw-badge" style={{ justifyContent: "center", fontSize: 11 }}>
                  Upgrade MAX
                </div>
              ) : (
                <button
                  className="hw-move-btn"
                  style={{ fontSize: 11, padding: "4px 6px" }}
                  disabled={runState.essence < cost}
                  onClick={() => onUpgrade(entry.key)}
                  title={`Permanently strengthen ${def?.name} (level ${level} -> ${level + 1})`}
                >
                  Upgrade ({cost} Essence)
                </button>
              )}
              {canReforge && (
                <button
                  className="hw-move-btn"
                  style={{ fontSize: 11, padding: "4px 6px" }}
                  disabled={runState.essence < REFORGE_COST}
                  onClick={() => handleReforge(entry.key)}
                  title={`Swap ${def?.name} for a different random unit of the same tier`}
                >
                  Reforge ({REFORGE_COST} Essence)
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
