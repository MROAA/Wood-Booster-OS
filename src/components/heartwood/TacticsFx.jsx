// Hearthwood Frontier - battle feel (lunges, hit flashes, floating
// numbers, reaction callouts, sounds). The tactics engine is pure and
// returns only the END state of an action - one End Turn resolves the
// whole enemy phase at once - so the engine also keeps a small `events`
// feed (tacticsEngine.js's emit) of what happened, and this component
// replays the NEW ones (seq above the last seen) as a staggered
// sequence of beats: every "strike" starts a beat, its damage lands a
// moment later. HP changes with no damage event (poison/regen ticks, a
// heal, the Ancients' charge) fall back to a plain hp/block diff, the
// same fallback FloatingNumbers.jsx uses for the auto-battler.
//
// Renders only the floating popups; everything else is a short-lived
// class or Web Animation on the board's own tokens (located by
// data-unit-id). The lunge animates the CSS `translate` property, which
// composes with (never fights) framer-motion's own layout `transform`.
import { useEffect, useRef, useState } from "react"
import { FloatingNumber } from "./FloatingNumbers"
import { play } from "../../services/heartwood/soundManager"

const BEAT_MS = 420
const IMPACT_DELAY_MS = 150
const BIG_HIT = 15 // match FloatingNumbers.jsx
// How long a unit that just fell stays on the board (faded) so its own
// killing blow is visible before it disappears.
export const FALLEN_LINGER_MS = 1400

const reduceMotion = () => document.documentElement.classList.contains("hw-reduce-motion")

function tokenEl(unitId) {
  return document.querySelector(`.hwt-token[data-unit-id="${unitId}"], .hwt-token-fallen[data-unit-id="${unitId}"]`)
}

function restartClass(el, cls, ms) {
  if (!el) return
  el.classList.remove(cls)
  void el.offsetWidth
  el.classList.add(cls)
  setTimeout(() => el.classList.remove(cls), ms)
}

function lunge(actorId, targetId, ranged) {
  const a = tokenEl(actorId)
  const t = tokenEl(targetId)
  if (!a || !t || reduceMotion()) return
  const ra = a.getBoundingClientRect()
  const rt = t.getBoundingClientRect()
  const dx = rt.left - ra.left
  const dy = rt.top - ra.top
  const k = ranged ? 0.1 : 0.38
  a.animate([{ translate: "0 0" }, { translate: `${dx * k}px ${dy * k}px` }, { translate: "0 0" }], {
    duration: 280,
    easing: "cubic-bezier(.3,.7,.4,1)",
  })
  if (ranged) {
    const bolt = document.createElement("div")
    bolt.className = "hwt-projectile"
    bolt.style.left = `${ra.left + ra.width / 2}px`
    bolt.style.top = `${ra.top + ra.height / 2}px`
    document.body.appendChild(bolt)
    bolt
      .animate([{ translate: "0 0", opacity: 1 }, { translate: `${dx}px ${dy}px`, opacity: 0.9 }], { duration: IMPACT_DELAY_MS + 40, easing: "ease-in" })
      .finished.finally(() => bolt.remove())
  }
}

function shakeBoard() {
  if (reduceMotion()) return
  restartClass(document.querySelector(".hwt-board"), "hw-stage-shake", 260)
}

// Groups events into beats: a strike/aoe/power opens a new beat, and
// everything after it (its damage, reactions) belongs to that beat.
function toBeats(events) {
  const beats = []
  for (const ev of events) {
    if (ev.kind === "strike" || ev.kind === "aoe" || ev.kind === "power" || !beats.length) beats.push([ev])
    else beats[beats.length - 1].push(ev)
  }
  return beats
}

export default function TacticsFx({ battle }) {
  const [popups, setPopups] = useState([])
  const counterRef = useRef(0)
  const lastSeqRef = useRef(null)
  const prevUnitsRef = useRef(null)
  const phaseRef = useRef(battle.phase)
  // Timers are NOT cleared when the next action lands - a quick second
  // click must not cut the previous action's beats short - only on
  // unmount (leaving the fight).
  const timersRef = useRef([])
  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  useEffect(() => {
    // First render (or a reload mid-fight): never replay history.
    if (lastSeqRef.current === null) {
      lastSeqRef.current = battle.eventSeq || 0
      prevUnitsRef.current = new Map(battle.units.map((u) => [u.id, { hp: u.hp, block: u.block }]))
      return undefined
    }
    const fresh = (battle.events || []).filter((e) => e.seq > lastSeqRef.current)
    lastSeqRef.current = battle.eventSeq || lastSeqRef.current
    const prevUnits = prevUnitsRef.current || new Map()
    prevUnitsRef.current = new Map(battle.units.map((u) => [u.id, { hp: u.hp, block: u.block }]))

    const pop = (unitId, text, kind, extra = {}) =>
      setPopups((cur) => [...cur, { id: counterRef.current++, unitId, text, kind, offset: 0, ...extra }])

    const timers = timersRef.current
    const beats = toBeats(fresh)
    beats.forEach((beat, i) => {
      const at = i * BEAT_MS
      for (const ev of beat) {
        if (ev.kind === "strike") {
          timers.push(setTimeout(() => lunge(ev.actorId, ev.targetId, ev.ranged), at))
        } else if (ev.kind === "aoe") {
          timers.push(setTimeout(() => { shakeBoard(); play("hitBig") }, at))
        } else if (ev.kind === "power") {
          timers.push(setTimeout(() => { pop(ev.actorId, ev.label, "callout"); play("shopEnter", { gain: 0.8 }) }, at))
        } else if (ev.kind === "damage") {
          timers.push(
            setTimeout(() => {
              const big = ev.amount >= BIG_HIT
              restartClass(tokenEl(ev.targetId), "hw-hit-flash", 400)
              if (ev.amount > 0) pop(ev.targetId, `-${ev.amount}`, "damage", { big })
              else if (ev.absorbed > 0) pop(ev.targetId, "Blocked", "block")
              if (big) shakeBoard()
              if (ev.fell) play("ko")
              else if (ev.amount > 0) play(big ? "hitBig" : "hit")
              else play("block", { gain: 0.7 })
              if (ev.revived) pop(ev.targetId, "Revived!", "callout", { offset: 1 })
            }, at + IMPACT_DELAY_MS),
          )
        } else if (ev.kind === "ward") {
          timers.push(setTimeout(() => { restartClass(tokenEl(ev.targetId), "hw-hit-flash", 400); pop(ev.targetId, "Warded!", "ward"); play("block", { gain: 0.7 }) }, at + IMPACT_DELAY_MS))
        } else if (ev.kind === "reaction") {
          timers.push(setTimeout(() => pop(ev.unitId, ev.label, "callout", { offset: 1 }), at))
        } else if (ev.kind === "heal") {
          timers.push(setTimeout(() => { pop(ev.targetId, `+${ev.amount}`, "heal"); play("heal") }, at))
        }
      }
    })

    // Fallback diff: hp/block changes no event explains (ticks, auras).
    const explained = new Set(fresh.filter((e) => e.kind === "damage" || e.kind === "heal").map((e) => e.targetId))
    const tail = beats.length * BEAT_MS
    for (const u of battle.units) {
      const before = prevUnits.get(u.id)
      if (!before) continue
      const dHp = u.hp - before.hp
      const dBlock = u.block - before.block
      if (dHp !== 0 && !explained.has(u.id)) {
        timers.push(setTimeout(() => { pop(u.id, dHp > 0 ? `+${dHp}` : `${dHp}`, dHp > 0 ? "heal" : "damage"); if (dHp < 0) restartClass(tokenEl(u.id), "hw-hit-flash", 400) }, tail))
      }
      if (dBlock > 0) timers.push(setTimeout(() => pop(u.id, `+${dBlock}`, "block", { offset: 1 }), tail))
    }
    return undefined
  }, [battle])

  useEffect(() => {
    if (battle.phase === phaseRef.current) return
    phaseRef.current = battle.phase
    if (battle.phase === "won") play("victory")
    else if (battle.phase === "lost") play("defeat")
  }, [battle.phase])

  return (
    <>
      {popups.map((p) => (
        <FloatingNumber key={p.id} popup={p} onDone={() => setPopups((cur) => cur.filter((x) => x.id !== p.id))} />
      ))}
    </>
  )
}
