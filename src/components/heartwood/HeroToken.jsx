// The Commander on the battle board, drawn (HeroAvatar) instead of a glyph,
// and alive: the face follows the fight and the hero speaks a hand-authored
// line (heroes.js `lines`) at the moments that matter.
//
//   battle start -> "start" line        took damage -> hurt face + line
//   healed       -> joy face + line     Active Power fired this turn -> joy
//   low HP       -> hurt face           won / lost -> victory / defeat
//
// Lines are rate-limited so a long fight never turns into chatter; victory
// and defeat always get their line.

import { useEffect, useRef, useState } from "react"
import HeroAvatar from "./HeroAvatar"
import { heroIdForArt, heroLine } from "../../data/heartwood/heroes"
import { chosenSkinOf } from "../../services/heartwood/heroSkins"

const REACT_MS = 1100
const BUBBLE_MS = 2600
const LINE_COOLDOWN_MS = 5000

export function heroIdOfUnit(unit) {
  if (!unit || unit.side !== "player") return null
  if (!(unit.commander || unit.id === "player-commander")) return null
  return heroIdForArt(unit.art)
}

export function baseMood(unit, battle) {
  if (battle?.phase === "won") return "victory"
  if (battle?.phase === "lost" || unit.hp <= 0) return "defeat"
  if (battle?.activePower?.firedTurn != null && battle.activePower.firedTurn === battle.turn) return "joy"
  if (unit.maxHp > 0 && unit.hp / unit.maxHp <= 0.35) return "hurt"
  return "neutral"
}

export default function HeroToken({ unit, heroId, battle, speak = false }) {
  const [flash, setFlash] = useState(null)
  const [bubble, setBubble] = useState(null)
  const prevHp = useRef(unit.hp)
  const lastLineAt = useRef(0)
  const saidEnd = useRef(null)

  function say(moment, force = false) {
    if (!speak) return
    const now = Date.now()
    if (!force && now - lastLineAt.current < LINE_COOLDOWN_MS) return
    const text = heroLine(heroId, moment)
    if (!text) return
    lastLineAt.current = now
    setBubble({ moment, text, key: now })
  }

  // Opening line, once, only when the fight is actually starting.
  useEffect(() => {
    if (speak && (battle?.turn == null || battle.turn <= 1) && battle?.phase !== "won" && battle?.phase !== "lost") say("start", true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const before = prevHp.current
    prevHp.current = unit.hp
    if (unit.hp < before && unit.hp > 0) {
      setFlash("hurt")
      say("hurt")
    } else if (unit.hp > before) {
      setFlash("joy")
      say("joy")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.hp])

  useEffect(() => {
    const end = battle?.phase === "won" ? "victory" : battle?.phase === "lost" ? "defeat" : null
    if (end && saidEnd.current !== end) {
      saidEnd.current = end
      say(end, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [battle?.phase])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), REACT_MS)
    return () => clearTimeout(t)
  }, [flash])

  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(null), BUBBLE_MS)
    return () => clearTimeout(t)
  }, [bubble])

  const base = baseMood(unit, battle)
  const mood = base === "victory" || base === "defeat" ? base : flash || base
  return (
    <>
      <div className="hwt-token-art" data-has-image="hero" data-hero-mood={mood}>
        <HeroAvatar heroId={heroId} variant="battle" mood={mood} skin={chosenSkinOf(heroId)} />
      </div>
      {bubble && (
        <span key={bubble.key} className="hwh-bubble" data-moment={bubble.moment} data-hero-line={heroId}>
          {bubble.text}
        </span>
      )}
    </>
  )
}
