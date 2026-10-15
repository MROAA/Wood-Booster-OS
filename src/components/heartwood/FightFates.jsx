import { riskOf, fatesThisFight } from "../../services/heartwood/betweenFights"
import { FATE_KINDS } from "../../data/heartwood/fates"
import { setManaBonus } from "../../data/heartwood/buildSets"
import { CardGlyph } from "./cardArt"

// Formation-screen strip (between-fights build depth): what your map
// choices bring INTO this fight - the risky path you took, an ally or a
// rival arriving, a curse or a mana tide, set mana and a camp Overcharge.
// Hidden when there is nothing to say.
export default function FightFates({ runState, node }) {
  const risk = riskOf(node)
  const fates = fatesThisFight(runState)
  const mana = setManaBonus(runState)
  const charge = runState?.campOvercharge || 0
  const lines = []
  if (risk.id !== "safe") lines.push({ key: "risk", icon: risk.icon, color: risk.color, text: `${risk.name}: ${risk.blurb}` })
  for (const f of fates) {
    const k = FATE_KINDS[f.kind]
    const what =
      f.kind === "ally"
        ? `${f.allyName} fights on your side.`
        : f.kind === "rival"
          ? `${f.rivalName ? f.rivalName[0].toUpperCase() + f.rivalName.slice(1) : "A rival"} hunts you here - tougher than the rest.`
          : f.text
    lines.push({ key: f.uid, icon: k.icon, color: k.color, text: `${f.title}: ${what}`, kind: f.kind })
  }
  if (charge) lines.push({ key: "camp", icon: "cosmic", color: "#7fa8e0", text: `Camp Commune: your squad starts Overcharged (+${charge}).` })
  if (mana.pool || mana.regen || mana.onHit || mana.startOvercharge) {
    const bits = [mana.pool && `+${mana.pool} max`, mana.regen && `+${mana.regen}/turn`, mana.onHit && `+${mana.onHit} on hit`, mana.startOvercharge && `+${mana.startOvercharge} Overcharge`].filter(Boolean)
    lines.push({ key: "setmana", icon: "tide", color: "#7fa8e0", text: `Set mana: ${bits.join(" · ")}` })
  }
  if (!lines.length) return null
  return (
    <ul className="hw-fight-fates">
      {lines.map((l) => (
        <li key={l.key} className="hw-fight-fate" data-kind={l.kind || l.key} style={{ "--hw-fate": l.color }}>
          <CardGlyph name={l.icon} className="hw-fight-fate-glyph" />
          <span>{l.text}</span>
        </li>
      ))}
    </ul>
  )
}
