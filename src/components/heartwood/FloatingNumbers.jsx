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

// Must match AutoBattleView.jsx's own LUNGE_STAGGER_MS - not imported,
// since neither file otherwise depends on the other, but a damage
// popup firing at the same stagger as its matching lunge is what makes
// each number read as "that hit, landing" rather than an unrelated
// number appearing somewhere on screen at an arbitrary moment.
const EVENT_STAGGER_MS = 640

// Watches HP/Block/Ward on the player and every enemy piece between
// state updates and spawns a brief floating number near the real DOM
// element for whatever changed, so damage/heal/block reads as
// something happening in the moment, not just a number silently
// changing on a bar.
//
// Damage/Ward specifically come from `state.roundEvents` (effects.js's
// recordAttackEvent) instead of the before/after diff below - Marc:
// "jokaiselle hahmolle pitää luoda oma damage numero... haluan silleen
// että jokaisen hahmon damage näytetään erikseen" (each character
// needs its own damage number, shown separately). The diff below only
// ever sees one before/after pair per unit per round, so 2+ attackers
// landing on the same target in the same round used to collapse into
// one combined number - roundEvents has one entry per individual
// dealDamage call instead, letting each hit spawn (and stagger) its
// own popup. Heal/Block stay diff-based below: those are still
// effectively single-source-per-unit-per-round in practice (a unit's
// own turnStart move, a status tick), and diffing a snapshot pair is
// the simplest correct thing when there's no "which of several actors
// did this" question to answer.
export default function FloatingNumbers({ state }) {
  const [popups, setPopups] = useState([])
  const prevRef = useRef(null)
  const counterRef = useRef(0)

  useEffect(() => {
    const events = state.roundEvents || []
    if (!events.length) return
    const timers = events.map((ev, i) =>
      setTimeout(() => {
        if (ev.kind === "ward") {
          flashHit(ev.targetId)
          setPopups((cur) => [...cur, { id: counterRef.current++, unitId: ev.targetId, text: "Warded!", kind: "ward", offset: 0 }])
        } else if (ev.kind === "damage" && ev.amount) {
          flashHit(ev.targetId)
          setPopups((cur) => [...cur, { id: counterRef.current++, unitId: ev.targetId, text: `-${ev.amount}`, kind: "damage", offset: 0 }])
        }
      }, i * EVENT_STAGGER_MS),
    )
    return () => timers.forEach(clearTimeout)
  }, [state])

  useEffect(() => {
    // The autobattler puts the whole player squad in `state.playerUnits[]`
    // (same shape as `state.enemies[]`); the older single-hero engine
    // still has a singular `state.player`. Diff whichever shape is
    // present so this component works for either engine unchanged.
    const snapshot = {
      player: state.playerUnits ? null : { hp: state.player.hp, block: state.player.block },
      playerUnits: state.playerUnits ? state.playerUnits.map((u) => ({ id: u.id, hp: u.hp, block: u.block })) : [],
      enemies: state.enemies.map((e) => ({ id: e.id, hp: e.hp, block: e.block })),
    }
    const prev = prevRef.current
    prevRef.current = snapshot
    if (!prev) return // nothing to diff against on the very first render

    // Damage is handled by the roundEvents-based effect above; a unit
    // that has its own damage event this round is skipped here to
    // avoid a duplicate, redundant "combined total" popup on top of
    // its real per-hit ones. HP loss that DIDN'T go through
    // dealDamage (Poison/other status ticks - effects.js's tickPoison
    // calls loseHp directly, no actor involved) never gets a
    // roundEvents entry, so it still needs this diff-based fallback to
    // show anything at all.
    const damagedByEvent = new Set(
      (state.roundEvents || []).filter((e) => e.kind === "damage" && e.amount).map((e) => e.targetId),
    )

    const spawned = []
    function diff(unitId, before, after) {
      if (!before) return
      const hpDelta = after.hp - before.hp
      const blockDelta = after.block - before.block
      if (hpDelta > 0 || (hpDelta < 0 && !damagedByEvent.has(unitId))) {
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
