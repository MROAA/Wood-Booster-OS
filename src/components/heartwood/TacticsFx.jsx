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

// Element combos: briefly light up the tiles a combo touched.
function flashTiles(tiles, combo) {
  const board = document.querySelector(".hwt-board")
  if (!board || !tiles) return
  const cols = getComputedStyle(board).gridTemplateColumns.split(" ").length
  for (const t of tiles) {
    const cell = board.children[t.row * cols + t.col]
    if (!cell) continue
    cell.dataset.comboFlash = combo
    restartClass(cell, "hwt-combo-flash", 700)
  }
}

// Ranged rework: center of a board cell in viewport pixels.
function cellCenter(pos) {
  const board = document.querySelector(".hwt-board")
  if (!board || !pos) return null
  const cols = getComputedStyle(board).gridTemplateColumns.split(" ").length
  const cell = board.children[pos.row * cols + pos.col]
  if (!cell) return null
  const r = cell.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

// Ranged rework shot visuals: "beam" (a line of light), "arc" / "smoke"
// (a lobbed shell), "ricochet" / "suppress" / "shred" (fast tracers).
function shotFx(ev) {
  const a = cellCenter(ev.from)
  const b = cellCenter(ev.to)
  const flash = ev.fx === "smoke" ? "smoke" : ev.fx === "beam" ? "beam" : ev.fx === "arc" ? "blast" : "shot"
  if (!a || !b || reduceMotion()) {
    flashTiles(ev.tiles, flash)
    return
  }
  const dx = b.x - a.x
  const dy = b.y - a.y
  const el = document.createElement("div")
  el.className = `hwt-shot-fx hwt-shot-${ev.fx}`
  el.style.left = `${a.x}px`
  el.style.top = `${a.y}px`
  document.body.appendChild(el)
  let anim
  if (ev.fx === "beam") {
    el.style.width = `${Math.hypot(dx, dy)}px`
    el.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`
    anim = el.animate([{ opacity: 0, scale: "1 0.2" }, { opacity: 1, scale: "1 1", offset: 0.25 }, { opacity: 0, scale: "1 0.6" }], { duration: 520, easing: "ease-out" })
  } else if (ev.fx === "arc" || ev.fx === "smoke") {
    const lift = -Math.max(50, Math.hypot(dx, dy) * 0.45)
    anim = el.animate(
      [
        { translate: "0 0", scale: "0.8" },
        { translate: `${dx / 2}px ${dy / 2 + lift}px`, scale: "1.25" },
        { translate: `${dx}px ${dy}px`, scale: "0.9" },
      ],
      { duration: 420, easing: "ease-in-out" },
    )
  } else {
    const count = ev.fx === "suppress" ? 3 : 1
    anim = el.animate([{ translate: "0 0", opacity: 1 }, { translate: `${dx}px ${dy}px`, opacity: 0.9 }], { duration: 220, easing: "ease-in", iterations: count })
  }
  anim.finished.finally(() => {
    el.remove()
    flashTiles(ev.tiles, flash)
  })
}

// Groups events into beats: a strike/aoe/power opens a new beat, and
// everything after it (its damage, reactions) belongs to that beat.
function toBeats(events) {
  const beats = []
  for (const ev of events) {
    // Chaos sprint: every step of a chain reaction gets its own beat, in order.
    if (ev.kind === "strike" || ev.kind === "aoe" || ev.kind === "power" || ev.kind === "bossPhase" || ev.kind === "shot" || ev.kind === "chaos" || !beats.length) beats.push([ev])
    else beats[beats.length - 1].push(ev)
  }
  return beats
}

export default function TacticsFx({ battle }) {
  const [popups, setPopups] = useState([])
  // Boss fights: a big "Phase N: name" banner on a phase change.
  const [banner, setBanner] = useState(null)
  // Chaos sprint: a "CHAIN REACTION xN" banner for 2+ step chains.
  const [chain, setChain] = useState(null)
  const flashSeqRef = useRef(battle.bossFlash?.seq ?? null)
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
        if (ev.kind === "shot") {
          timers.push(setTimeout(() => { shotFx(ev); play(ev.fx === "beam" || ev.fx === "arc" ? "hitBig" : "hit", { gain: 0.6 }) }, at))
        } else if (ev.kind === "strike") {
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
        } else if (ev.kind === "graze") {
          // XCOM part 2: the roll missed - a glancing GRAZE (half damage).
          timers.push(setTimeout(() => pop(ev.targetId, "GRAZE", "graze", { offset: 1.2 }), at + IMPACT_DELAY_MS))
        } else if (ev.kind === "ward") {
          timers.push(setTimeout(() => { restartClass(tokenEl(ev.targetId), "hw-hit-flash", 400); pop(ev.targetId, "Warded!", "ward"); play("block", { gain: 0.7 }) }, at + IMPACT_DELAY_MS))
        } else if (ev.kind === "reaction" && ev.label === "Overwatch!") {
          // XCOM part 1: an Overwatch shot gets a big eye callout on the shooter.
          timers.push(setTimeout(() => { pop(ev.unitId, "👁 Overwatch!", "combo", { offset: 1.4, big: true, combo: "overwatch" }); play("hit", { gain: 0.8 }) }, at))
        } else if (ev.kind === "reaction") {
          timers.push(setTimeout(() => pop(ev.unitId, ev.label, "callout", { offset: 1 }), at))
        } else if (ev.kind === "combo") {
          // Element combos: a big distinct callout, tile flash, shake if big.
          timers.push(setTimeout(() => { pop(ev.unitId, ev.label, "combo", { offset: 1.4, big: ev.big, combo: ev.combo }); flashTiles(ev.tiles, ev.combo); if (ev.big) { shakeBoard(); play("hitBig") } }, at + IMPACT_DELAY_MS))
        } else if (ev.kind === "bossPhase") {
          timers.push(setTimeout(() => {
            pop(ev.unitId, ev.name, "combo", { offset: 1.4, big: true, combo: "boss" })
            shakeBoard()
            play("hitBig")
            setBanner({ key: ev.seq, index: ev.index, name: ev.name })
            timers.push(setTimeout(() => setBanner((b) => (b && b.key === ev.seq ? null : b)), 2200))
          }, at))
        } else if (ev.kind === "chaos") {
          // Chaos combos: "Chain x2: Into the lava!" + tile flash; the banner shakes the board.
          timers.push(setTimeout(() => {
            pop(ev.unitId, ev.label, "combo", { offset: ev.big ? 2 : 1.4, big: !!ev.big || ev.step > 1, combo: "chaos" })
            if (ev.tiles?.length) flashTiles(ev.tiles, "chaos")
            if (ev.big) {
              shakeBoard()
              play("hitBig")
              setChain({ key: ev.seq, n: ev.chain })
              timers.push(setTimeout(() => setChain((c) => (c && c.key === ev.seq ? null : c)), 1800))
            } else play("hit", { gain: 0.8 })
          }, at + IMPACT_DELAY_MS))
        } else if (ev.kind === "object") {
          // Destructibles: tile flash + shake/sound (the board shows the callout text).
          timers.push(setTimeout(() => {
            flashTiles(ev.tiles || [ev.pos], `obj-${ev.fx}`)
            if (["boom", "fall", "shatter", "spore"].includes(ev.fx)) { shakeBoard(); play("hitBig") }
            else if (ev.fx === "roll" || ev.fx === "break") play("hit")
          }, at + IMPACT_DELAY_MS))
        } else if (ev.kind === "mana") {
          // Mana step 1: "+N mana" (gains), "-N mana" (drain/burn), Overcharge spend.
          // Resources step 2: in the hero's own resource ("+10 Rage"), breakpoints glow gold.
          const res = ev.res || "mana"
          const text = ev.text || (ev.amount > 0 ? `+${ev.amount} ${res}${ev.overcharge ? " ⚡" : ""}` : `${ev.amount} ${res}`)
          const kind = ev.label === "breakpoint" ? "mana-bp" : ev.amount < 0 ? "mana-drain" : "mana"
          timers.push(setTimeout(() => pop(ev.unitId, text, kind, { offset: 0.6 }), at + IMPACT_DELAY_MS))
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

  // Boss arena hazards: light up the tiles that just erupted/changed.
  useEffect(() => {
    const flash = battle.bossFlash
    if (!flash || flash.seq === flashSeqRef.current) return
    flashSeqRef.current = flash.seq
    flashTiles(flash.tiles, `boss-${flash.kind}`)
  }, [battle.bossFlash])

  useEffect(() => {
    if (battle.phase === phaseRef.current) return
    phaseRef.current = battle.phase
    if (battle.phase === "won") play("victory")
    else if (battle.phase === "lost") play("defeat")
  }, [battle.phase])

  return (
    <>
      {banner && (
        <div className="hwt-boss-phase-banner" key={banner.key} data-phase-index={banner.index}>
          <span className="hwt-boss-phase-banner-num">Phase {banner.index + 1}</span>
          <span className="hwt-boss-phase-banner-name">{banner.name}</span>
        </div>
      )}
      {chain && (
        <div className="hwt-chaos-banner" key={chain.key} data-chain={chain.n}>
          Chain reaction <b>x{chain.n}</b>!
        </div>
      )}
      {popups.map((p) => (
        <FloatingNumber key={p.id} popup={p} onDone={() => setPopups((cur) => cur.filter((x) => x.id !== p.id))} />
      ))}
    </>
  )
}
