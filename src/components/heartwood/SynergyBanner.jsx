import { motion } from "framer-motion"
import { TRIBES } from "../../data/heartwood/synergies"
import { CardGlyph } from "./cardArt"

// The "synergy WOW moment" (roadmap task "Taistelukentan lava-tuntuma +
// synergia-WOW-hetki") - Marc's PRD names synergy activation as one of
// the most important WOW beats in the whole game: "Pelaaja ymmärtää
// visuaalisesti, että juuri tapahtui jotain merkittävää." AutoBattleView.jsx
// detects a real, newly-active tribe synergy (see its own comment) and
// mounts one of these per activation - a genuinely new DOM node each
// time (keyed by a monotonic seq, not the tribeId), so the pop-in/pop-out
// animation always plays fresh even if the SAME tribe surges again in a
// later fight. Self-removing via onAnimationComplete, the exact pattern
// FloatingNumbers.jsx's own FloatingNumber already established in this
// file family - no setTimeout cleanup to get wrong, no way to get stuck
// on screen.
//
// Marc's follow-up note on this same task: "kultainen leikkaus jne,
// geometriaa" - the entry/hold/exit timing below is deliberately split
// along the golden ratio (PHI = 1.618) rather than round numbers, and
// the entry scale undershoots from 1/PHI (~0.618) rather than an
// arbitrary 0.6/0.8/etc.
const PHI = 1.618
// Total lifetime: PHI^2 seconds (~2.62s) - long enough to actually read
// the label at a glance, but short enough to fully resolve within one
// ROUND_DELAY_MS (2200ms) + a little, so it never overlaps into a
// second round's own action and start competing with the next hit's
// floating numbers.
const DURATION_S = PHI * PHI

// A surge is one of three kinds now: a tribe tier ("Warden synergy
// active"), a cross-tribe combo ("Bloodhunt - Fang + Root"), or a
// formation/positional synergy ("Phalanx"). Each resolves to an
// icon / colour / line here; the golden-ratio timing and self-removal
// are identical for all three.
function surgeVisual(surge) {
  if (surge.kind === "combo") {
    const [a, b] = Object.keys(surge.combo.tribes)
    const ca = TRIBES[a]?.color || "var(--hw-rune)"
    const cb = TRIBES[b]?.color || "var(--hw-rune)"
    return {
      icon: "spark",
      color: `color-mix(in srgb, ${ca} 50%, ${cb})`,
      text: `Combo — ${surge.combo.label}`,
    }
  }
  if (surge.kind === "position") {
    return { icon: "shield", color: "var(--hw-rune)", text: `Formation — ${surge.synergy.label}` }
  }
  const tribe = TRIBES[surge.tribeId]
  if (!tribe) return null
  return { icon: tribe.icon, color: tribe.color, text: `${tribe.name} synergy active — ${surge.activeTier.label}` }
}

export default function SynergyBanner({ surge, index, onDone }) {
  const v = surgeVisual(surge)
  if (!v) return null
  return (
    <motion.div
      className="hw-synergy-banner"
      // Fibonacci vertical stagger (34px, index.css's own --space-4) for
      // the case 2+ synergies land in the very same battle - stacks
      // instead of overlapping.
      style={{
        marginTop: index * 34,
        borderColor: v.color,
        color: v.color,
        boxShadow: `0 0 21px 3px color-mix(in srgb, ${v.color} 55%, transparent)`,
      }}
      initial={{ opacity: 0, scale: 1 / PHI, x: "-50%", y: -8 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [1 / PHI, 1.05, 1, 1], x: "-50%", y: [-8, 0, 0, -4] }}
      transition={{ duration: DURATION_S, ease: "easeOut", times: [0, 0.236, 0.764, 1] }}
      onAnimationComplete={onDone}
    >
      <CardGlyph name={v.icon} className="hw-intent-glyph" />
      {v.text}
    </motion.div>
  )
}
