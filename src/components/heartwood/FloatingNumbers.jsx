import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

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
    const snapshot = {
      player: { hp: state.player.hp, block: state.player.block },
      enemies: state.enemies.map((e) => ({ id: e.id, hp: e.hp, block: e.block })),
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
    }

    diff("player", prev.player, snapshot.player)
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

  return (
    <motion.div
      className={`hw-floating-number hw-floating-number--${popup.kind}`}
      style={{ position: "fixed", top: rect.top, left: rect.left }}
      initial={{ opacity: 0, y: 6, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], y: -36, scale: 1 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
      onAnimationComplete={onDone}
    >
      {popup.text}
    </motion.div>
  )
}
