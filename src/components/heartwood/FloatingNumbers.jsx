import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

// A brief flash+shake directly on the struck unit's own DOM element,
// alongside the floating number - a class toggle rather than React
// state, since it's a fire-and-forget visual pulse with no state
// anything else needs to know about.
function flashHit(unitId) {
  const el = document.querySelector(`[data-unit-id="${unitId}"]`)
  if (!el) return
  el.classList.remove("hw-hit-flash")
  // Force reflow so re-adding the class restarts the animation even if
  // the unit was hit again before the previous flash finished.
  void el.offsetWidth
  el.classList.add("hw-hit-flash")
  setTimeout(() => el.classList.remove("hw-hit-flash"), 400)
}

// Watches HP/Block on the player and every enemy piece between state
// updates and spawns a brief floating number near the real DOM element
// for whatever changed, so damage/heal/block reads as something
// happening in the moment, not just a number silently changing on a
// bar. One popup per state transition per unit (the engine resolves a
// whole card play or a whole enemy turn in one step, so several hits
// landing in the same transition show as one combined number, not one
// per hit - a deliberate tradeoff, not a bug).
export default function FloatingNumbers({ state }) {
  const [popups, setPopups] = useState([])
  const prevRef = useRef(null)
  const counterRef = useRef(0)

  useEffect(() => {
    // The autobattler puts the whole player squad in `state.playerUnits[]`
    // (same shape as `state.enemies[]`); the older single-hero engine
    // still has a singular `state.player`. Diff whichever shape is
    // present so this component works for either engine unchanged.
    const snapshot = {
      player: state.playerUnits ? null : { hp: state.player.hp, block: state.player.block, ward: 0 },
      playerUnits: state.playerUnits
        ? state.playerUnits.map((u) => ({ id: u.id, hp: u.hp, block: u.block, ward: u.powers?.ward || 0 }))
        : [],
      enemies: state.enemies.map((e) => ({ id: e.id, hp: e.hp, block: e.block, ward: e.powers?.ward || 0 })),
    }
    const prev = prevRef.current
    prevRef.current = snapshot
    if (!prev) return // nothing to diff against on the very first render

    const spawned = []
    function diff(unitId, before, after) {
      if (!before) return
      const hpDelta = after.hp - before.hp
      const blockDelta = after.block - before.block
      if (hpDelta !== 0) {
        spawned.push({
          id: counterRef.current++,
          unitId,
          text: hpDelta > 0 ? `+${hpDelta}` : `${hpDelta}`,
          kind: hpDelta > 0 ? "heal" : "damage",
          offset: 0,
        })
        if (hpDelta < 0) flashHit(unitId)
      }
      if (blockDelta > 0) {
        spawned.push({
          id: counterRef.current++,
          unitId,
          text: `+${blockDelta}`,
          kind: "block",
          offset: hpDelta !== 0 ? 1 : 0,
        })
      }
      // Ward (effects.js's dealDamage) fully negates a hit before it
      // ever touches HP or Block, so it's invisible to every diff
      // above by construction - the one status this component needs
      // its own explicit check for, or a warded hit would land with
      // zero player-visible feedback at all.
      const wardDelta = (after.ward || 0) - (before.ward || 0)
      if (wardDelta < 0) {
        spawned.push({
          id: counterRef.current++,
          unitId,
          text: "Warded!",
          kind: "ward",
          offset: hpDelta !== 0 || blockDelta > 0 ? 1 : 0,
        })
      }
    }

    if (snapshot.player) diff("player", prev.player, snapshot.player)
    for (const u of snapshot.playerUnits) {
      diff(u.id, prev.playerUnits.find((x) => x.id === u.id), u)
    }
    for (const e of snapshot.enemies) {
      diff(e.id, prev.enemies.find((x) => x.id === e.id), e)
    }
    if (spawned.length > 0) setPopups((cur) => [...cur, ...spawned])
  }, [state])

  function remove(id) {
    setPopups((cur) => cur.filter((p) => p.id !== id))
  }

  return (
    <>
      {popups.map((p) => (
        <FloatingNumber key={p.id} popup={p} onDone={() => remove(p.id)} />
      ))}
    </>
  )
}

function FloatingNumber({ popup, onDone }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    const el = document.querySelector(`[data-unit-id="${popup.unitId}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({ top: r.top + r.height / 2 - popup.offset * 26, left: r.left + r.width / 2 })
  }, [popup])

  if (!rect) return null

  // Marc: the numbers themselves were "liian pieniä/huomaamattomia"
  // (too small/unnoticeable) - alongside the size/contrast bump in
  // heartwood.css, gave the pop itself more presence too: a bigger
  // starting scale overshoot (0.8 -> 1.3 -> 1, the same "pop" curve
  // .hw-badge-pop already uses elsewhere in this game rather than a
  // new easing invented just for this), a longer hang time (0.9s ->
  // 1.2s) and more travel (-36px -> -52px) so there's more time and
  // more motion to actually catch mid-fight, not just a bigger static
  // number in the same brief window as before.
  return (
    <motion.div
      className={`hw-floating-number hw-floating-number--${popup.kind}`}
      style={{ position: "fixed", top: rect.top, left: rect.left }}
      initial={{ opacity: 0, y: 6, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -52, scale: [0.6, 1.3, 1, 1] }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      onAnimationComplete={onDone}
    >
      {popup.text}
    </motion.div>
  )
}
