import { ITEMS } from "../../data/heartwood/items"
import { COUNTER_KITS, COUNTER_TAGS } from "../../data/heartwood/itemBuilds"
import { itemActivesOf, itemActiveBlocker, activeCostText, castItemActive } from "../../services/heartwood/tacticsItems"

// Dota depth sprint - the fight UI for item actives and enemy kits.
//  - ItemActions: one button per active item on the selected hero's action
//    bar (self actives fire at once; others arm "item@<id>" targeting -
//    TacticsBoard routes the board click to castItemActive).
//  - KitBadges: the small marks on a token (armour, Mist, shell, bloom,
//    seedcaller, hidden / revealed, Withered, lifted, Heartoak Bark).
//  - CounterPanel: the sidebar read - which tricks this pack brings and
//    whether your squad carries the answer.

export function ItemActions({ battle, selected, abilityMode, onAbilityModeChange, onBattleChange }) {
  const actives = itemActivesOf(selected)
  if (!selected || selected.side !== "player" || !actives.length || battle.phase !== "player") return null
  return (
    <div className="hwt-item-actives" data-item-actives={actives.length}>
      {actives.map((a) => {
        const why = itemActiveBlocker(battle, selected, a.id)
        const armed = abilityMode === `item@${a.id}`
        return (
          <button
            key={a.id}
            type="button"
            className="hwt-universal-btn hwt-item-active-btn"
            data-item-active={a.id}
            data-uses={a.charges != null ? a.charges : undefined}
            data-active={armed || undefined}
            data-cd={a.cd > 0 ? a.cd : undefined}
            disabled={!!why}
            onClick={() => {
              if (a.def.target === "self") {
                onAbilityModeChange(null)
                onBattleChange(castItemActive(battle, selected.id, a.id))
                return
              }
              onAbilityModeChange(armed ? null : `item@${a.id}`)
            }}
            title={`${a.def.name} (${ITEMS[a.itemId]?.name || "item"}) - ${a.def.text}\n${activeCostText(battle, selected, a.def, a)}${a.def.cooldown ? `, recharge ${a.def.cooldown}` : ""}${why ? `\n${why}` : ""}`}
          >
            <span className="hwt-universal-icon">{a.def.icon}</span> {a.def.name}
            <small className="hwt-universal-cost">{a.cd > 0 ? `recharging ${a.cd}` : activeCostText(battle, selected, a.def, a)}</small>
          </button>
        )
      })}
      {abilityMode?.startsWith("item@") && (
        <p className="hwt-skill-hint">
          {(() => {
            const def = actives.find((a) => `item@${a.id}` === abilityMode)?.def
            if (!def) return null
            return def.target === "tile" ? `Choose a tile for ${def.name}.` : def.target === "ally" ? `Choose an ally for ${def.name}.` : `Choose a unit for ${def.name}.`
          })()}
        </p>
      )}
      {selected.scepter && <p className="hwt-item-scepter">♛ Worldseed Scepter: signature skill empowered.</p>}
    </div>
  )
}

export function KitBadges({ unit }) {
  const kit = unit.kit ? COUNTER_KITS[unit.kit] : null
  const out = []
  if (kit) {
    const n = kit.id === "ironbark" ? unit.armor : kit.id === "mist" ? unit.blurCharges : kit.id === "runeshell" ? unit.shell : null
    out.push(
      <span key="kit" className="hwt-kit-badge" data-kit-badge={kit.id} data-revealed={kit.id === "shroud" && unit.revealed > 0 ? "true" : undefined} title={`${kit.name}: ${kit.text} Answer: ${kit.answers.map((a) => COUNTER_TAGS[a]?.label).join(" / ")}.${kit.id === "shroud" && unit.revealed > 0 ? ` Revealed (${unit.revealed}).` : ""}`}>
        {kit.icon}
        {n != null ? n : ""}
      </span>,
    )
  }
  if (unit.withered > 0)
    out.push(
      <span key="w" className="hwt-kit-badge" data-status="withered" title={`Withered (${unit.withered}) - can't be healed`}>
        ☠{unit.withered}
      </span>,
    )
  if (unit.lifted > 0)
    out.push(
      <span key="l" className="hwt-kit-badge" data-status="lifted" title="Lifted by a Cyclone - can't be hit, loses its next turn">
        🌀
      </span>,
    )
  if (unit.ctrlImmune > 0)
    out.push(
      <span key="c" className="hwt-kit-badge" data-status="unbending" title={`Heartoak Bark (${unit.ctrlImmune}) - immune to root, slow, stun, chill, hex and shoves`}>
        🛡{unit.ctrlImmune}
      </span>,
    )
  return out.length ? <>{out}</> : null
}

// Answers the squad carries into this fight (gear riders + actives).
function squadAnswers(battle) {
  const have = new Set(["skills"])
  for (const u of battle.units) {
    if (u.side !== "player" || u.hp <= 0) continue
    for (const id of u.gearIds || []) for (const t of ITEMS[id]?.counters || []) have.add(t)
    if (u.trueStrike) have.add("true-strike")
    if (u.gearCleave || u.perks?.includes("cleave")) have.add("area")
    if (u.gearManaBurn) have.add("mana-burn")
    if (u.gearWither) have.add("heal-cut")
    if (u.gearShred) have.add("shred")
    if (u.gearReveal) have.add("reveal")
    for (const a of u.itemActives || []) {
      if (a.id === "unbind" || a.id === "unbind-peal") have.add("dispel")
      if (a.id === "mana-burn") have.add("mana-burn")
      if (a.id === "glowdust") have.add("reveal")
    }
  }
  return have
}

export function CounterPanel({ battle }) {
  const kits = [...new Set(battle.units.filter((u) => u.side === "enemy" && u.hp > 0 && u.kit).map((u) => u.kit))].map((id) => COUNTER_KITS[id]).filter(Boolean)
  if (!kits.length) return null
  const have = squadAnswers(battle)
  return (
    <div className="hwt-counter-panel" data-counter-panel={kits.map((k) => k.id).join(" ")}>
      <div className="hwt-counter-title">Enemy tricks</div>
      {kits.map((k) => {
        const answered = k.answers.filter((a) => have.has(a) && a !== "skills")
        return (
          <div key={k.id} className="hwt-counter-row" data-kit={k.id} data-answered={answered.length > 0 || undefined}>
            <span className="hwt-counter-icon">{k.icon}</span>
            <span className="hwt-counter-name" title={k.text}>
              {k.name}
            </span>
            <span className="hwt-counter-answer">
              {answered.length ? `✓ ${answered.map((a) => COUNTER_TAGS[a]?.label).join(", ")}` : `answer: ${k.answers.map((a) => COUNTER_TAGS[a]?.label).join(" / ")}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
