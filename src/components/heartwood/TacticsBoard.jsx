// Hearthwood Frontier - the shared board+panel+result renderer, extracted
// from HeartwoodTactics.jsx (Phase 4 second slice: "fight one real battle
// for real") so the standalone /heartwood-tactics prototype page AND the
// new real-in-run battle branch in HeartwoodBattle.jsx can share ONE
// rendering + interaction-dispatch implementation instead of maintaining
// two copies of every archetype badge/highlight.
//
// Owns ZERO state itself - `battle`/`selectedId`/`abilityMode` are all
// caller-owned props (mirroring exactly how HeartwoodTactics.jsx already
// managed them before this extraction), so the caller decides where that
// state lives (local useState for the standalone page, runState-backed
// for a real fight). This component only decides WHAT to render and WHICH
// pure tacticsEngine.js function a click should call - it dispatches the
// result via `onBattleChange`, never holds the battle itself.
import { useEffect, useMemo, useRef, useState } from "react"
import { CardGlyph } from "./cardArt"
import { ElementBadges, ElementHelp } from "./TacticsElementsUi"
import { describeAbilityElement } from "../../services/heartwood/tacticsElements"
import { classInfoFor, classSkillUsable, classSkillStatus, classSkillTiles } from "../../services/heartwood/tacticsClasses"
import {
  reachableTilesFor,
  attackableTargets,
  moveUnit,
  attackUnit,
  castAbility,
  abilityTargets,
  abilityTargetSide,
  describeAbility,
  abilityHint,
  endPlayerTurn,
  activateCommanderPower,
  previewEnemyIntents,
  previewChargeThreat,
  zoneOfControlCells,
  threatZoneCells,
  fearZoneCells,
  frostZoneCells,
  thornZoneCells,
  flankRole,
  placeUnit,
  beginBattle,
  isDeployTile,
  attackWall,
  wallTargetsFor,
  wallHpAt,
  rangeAt,
  TERRAIN_INFO,
  WALL_MAX_HP,
  moveOptionsFor,
  movePathFor,
  dashMove,
  overwatchAction,
  hunkerDown,
  attackPreview,
} from "../../services/heartwood/tacticsEngine"
import { BATTLE_ROLES, roleOf, healReach } from "../../services/heartwood/tacticsRoles"
import { canAfford, hasMana, manaBlockReason, manaSummary, potionOf, drinkPotion, POTION_AP, ultimateReady, surgeFor, skillCostText, resourceLabel, profileOf, canSacrifice, sacrifice, sacrificeCost, scaleAmount } from "../../services/heartwood/tacticsMana"
import { ResourceGauge, ResourceInfo } from "./TacticsResourceUi"
import { isEngaged } from "../../services/heartwood/tacticsRanged"

// Melee rework: small status badges (Provoked, Vanished, Bastion, Shield Wall, Engaged, Berserk).
function MeleeBadges({ unit, battle }) {
  const marks = []
  if (unit.provoked > 0) marks.push(["provoked", "⚑", "Provoked - must attack the hero that taunted it"])
  if (unit.stealth > 0) marks.push(["stealth", "◐", "Vanished - shooters more than 2 tiles away can't target it"])
  if (unit.bastion > 0) marks.push(["bastion", "⛫", "Bastion - takes half damage, can't move"])
  if (unit.shieldWall > 0) marks.push(["shieldwall", "▦", "Shield Wall - allies right behind it have half cover"])
  if (unit.berserk > 0) marks.push(["berserk", "♨", "BERSERK - +50% damage"])
  if (isEngaged(battle, unit)) marks.push(["engaged", "⚔", "Engaged - an enemy fighter is next to this shooter: no Aim, no Overwatch"])
  if (!marks.length) return null
  return (
    <span className="hwt-melee-badges">
      {marks.map(([k, icon, title]) => (
        <span key={k} className="hwt-melee-badge" data-mark={k} title={title}>
          {icon}
        </span>
      ))}
    </span>
  )
}

// Resources step 2: the class resource gauge (styled per profile) under the HP bar.
function ManaBar({ unit, battle = null, className = "hwt-mana-track" }) {
  return <ResourceGauge unit={unit} battle={battle} className={className} />
}
import { rollsOn, coverAgainst, isFlanked, tileCoverSides, COVER_NAME } from "../../services/heartwood/tacticsCover"
import { motion } from "framer-motion"
import enemyPlaceholderImg from "../../assets/heartwood/enemies/enemy-placeholder.svg"
import TacticsFx, { FALLEN_LINGER_MS } from "./TacticsFx"
import { describeSkillIntent } from "../../services/heartwood/tacticsEnemyAbilities"
import { describeObjective, reinforcementWarningTiles, turnsUntilPulse } from "../../services/heartwood/tacticsObjectives"
import { PERKS } from "../../services/heartwood/unitLevels"
import { describeBoss, bossWarningTiles } from "../../services/heartwood/tacticsBosses"
import { OBJECTS, objectHpAt, objectMaxHp, isAttackableTile, describeObjectTile, isBurning, isChilled } from "../../services/heartwood/tacticsObjects"
import { describeFaction, blightPreviewKeys, isBlighted, factionInfo, BLIGHT_ATTACK_BONUS } from "../../services/heartwood/tacticsFactions"
import { terrainArtStyle, ObjectArt, TerrainIcon, BlightIcon, BLIGHT_ART_URL, SmokeArt } from "./TerrainArt"
import { archetypeOf, beamTiles, blastTiles, AIM_BONUS, SUPPRESS_PENALTY } from "../../services/heartwood/tacticsRanged"

// Ranged rework: tile skills that hit a 3x3 area (blast preview on hover).
const AREA_TILE_SKILLS = { "piercing-beam": "grenade", "smoke-screen": "smoke", "explosive-charge": "grenade" }

const BOSS_WARN_ICON = { quake: "✹", lava: "♨", water: "≈", wall: "▦", ice: "❄", poison: "☣", adds: "❖", teleport: "◎" }

// Boss fights (sprint 3): name, HP with phase markers, current phase,
// what the arena does next turn, shield + enrage status.
function BossBar({ info }) {
  const pct = Math.max(0, Math.round((info.hp / info.maxHp) * 100))
  return (
    <div className="hwt-boss-bar" data-boss-id={info.id} data-phase-index={info.phaseIndex} data-immune={info.immune}>
      <div className="hwt-boss-head">
        <span className="hwt-boss-name">{info.name}</span>
        <span className="hwt-boss-title">{info.title}</span>
      </div>
      <div className="hwt-boss-track" title={`${info.hp}/${info.maxHp} HP`}>
        <div className="hwt-boss-fill" style={{ width: `${pct}%` }} />
        {info.thresholds.map((t, i) => (
          <span key={i} className="hwt-boss-marker" data-passed={info.phaseIndex > i} style={{ left: `${Math.round(t * 100)}%` }} />
        ))}
        <span className="hwt-boss-hp">{info.hp}/{info.maxHp}</span>
      </div>
      <div className="hwt-boss-phase">
        Phase {info.phaseIndex + 1}/{info.phaseCount}: <strong>{info.phaseName}</strong>
      </div>
      <div className="hwt-boss-text">{info.phaseText}</div>
      {info.immune && (
        <div className="hwt-boss-shield">
          🛡 Shielded - break {info.weakPoints.map((w) => `${w.name} (${w.hp}/${w.maxHp})`).join(", ")}
        </div>
      )}
      {info.upcoming.map((u, i) => (
        <div key={i} className="hwt-boss-next" data-kind={u.kind}>
          {BOSS_WARN_ICON[u.kind] || "!"} {u.text}
        </div>
      ))}
      {info.enrage && <div className="hwt-boss-enrage">♨ {info.enrage}</div>}
    </div>
  )
}

function apPips(unit) {
  return Array.from({ length: unit.apMax }, (_, i) => (i < unit.ap ? "●" : "○")).join("")
}

// Facing round: a plain compass arrow, no new icon asset - always
// shown (unlike most badges, which are conditional on a stack/status
// being active), since facing is a permanent property of every unit,
// the same "always shown" category the AP-pips indicator already is.
const FACING_ARROW = { N: "↑", S: "↓", E: "→", W: "←" }

// Look & feel round: a token shows the unit's real portrait when it has
// one. Every enemy def currently points at the same shared placeholder
// SVG - showing that on every enemy would read as "all the same monster",
// so those keep their own distinct CardGlyph line art instead. (Compared
// against the imported URL itself - Vite inlines small SVGs as data URIs,
// so a filename check would miss it.)
function portraitOf(unit) {
  if (!unit?.image || unit.image === enemyPlaceholderImg) return null
  return unit.image
}

// Portrait (or glyph fallback) - shared by the live token, the fading
// fallen-unit ghost and the panel's selected-unit card.
function TokenArt({ unit }) {
  const src = portraitOf(unit)
  return (
    <div className="hwt-token-art" data-has-image={!!src}>
      {src ? (
        <img className="hwt-token-img" src={src} alt="" draggable={false} />
      ) : (
        <CardGlyph name={unit.art} className="hwt-token-glyph" />
      )}
    </div>
  )
}

function getUnitName(battle, id) {
  return battle.units.find((u) => u.id === id)?.name || "?"
}

// ---- XCOM part 1: roles, squad bar, board overlay ----------------------
const CELL = 76
const GAP = 3
const cellCenter = (p) => ({ x: p.col * (CELL + GAP) + CELL / 2, y: p.row * (CELL + GAP) + CELL / 2 })

function roleTitle(unit) {
  const r = BATTLE_ROLES[roleOf(unit)]
  return `${unit.name} - ${r.label}: ${r.what}${hasMana(unit) ? ` · ${manaSummary(unit)}` : ""}${unit.provoked > 0 ? " · PROVOKED: must attack its tank" : ""}${unit.stealth > 0 ? " · VANISHED: far shooters can't see it" : ""}${unit.bastion > 0 ? " · BASTION: half damage, can't move" : ""}${unit.shieldWall > 0 ? " · SHIELD WALL: allies behind it have half cover" : ""}`
}

// A tank that actively shields others (Taunt / Guard / Intercept kit).
function protectsAllies(battle, unit) {
  if (roleOf(unit) !== "tank") return false
  if (unit.taunt > 0 || (unit.shoutTurn != null && unit.shoutTurn === battle.turn) || unit.className === "Guardian") return true
  if (["taunt-shout", "shield-ally", "aura-block"].includes(unit.ability?.kind)) return true
  return (unit.classSkills || []).some((sk) => /guard|taunt|shield|wall|challenge|bodyguard|protect/i.test(sk.id))
}

// Player intents aimed at one of the squad: [{ enemyId, targetId }].
function aggroPairs(battle, intents) {
  const out = []
  for (const { enemyId, intent: raw } of intents) {
    const intent = raw.then || raw
    const hits = intent.kind === "attack" || intent.kind === "move-attack" || (intent.kind === "skill" && (intent.skillKind === "hex" || intent.skillKind === "pounce"))
    if (!hits || !intent.targetId) continue
    const t = battle.units.find((u) => u.id === intent.targetId)
    if (t && t.side === "player" && t.hp > 0) out.push({ enemyId, targetId: t.id })
  }
  return out
}

// XCOM part 2: half shield (left half filled) / full shield.
function ShieldIcon({ full }) {
  return (
    <svg className="hwt-shield-svg" viewBox="0 0 20 22" aria-hidden="true">
      <path d="M10 1 L18 4 V10 C18 15 14.5 19 10 21 C5.5 19 2 15 2 10 V4 Z" className="hwt-shield-outline" />
      {full ? (
        <path d="M10 1 L18 4 V10 C18 15 14.5 19 10 21 C5.5 19 2 15 2 10 V4 Z" className="hwt-shield-fill" />
      ) : (
        <path d="M10 1 V21 C5.5 19 2 15 2 10 V4 Z" className="hwt-shield-fill" />
      )}
    </svg>
  )
}

function BoardOverlay({ battle, pairs, hoverPath, selected, healReachTiles }) {
  const w = battle.grid.cols * (CELL + GAP) - GAP
  const h = battle.grid.rows * (CELL + GAP) - GAP
  const healRing =
    healReachTiles > 0 && selected
      ? {
          r: healReachTiles,
          r0: Math.max(0, selected.pos.row - healReachTiles),
          r1: Math.min(battle.grid.rows - 1, selected.pos.row + healReachTiles),
          c0: Math.max(0, selected.pos.col - healReachTiles),
          c1: Math.min(battle.grid.cols - 1, selected.pos.col + healReachTiles),
        }
      : null
  const byId = new Map(battle.units.map((u) => [u.id, u]))
  const tanks = battle.phase === "player" || battle.phase === "deploy" ? battle.units.filter((u) => u.hp > 0 && protectsAllies(battle, u)) : []
  return (
    <svg className="hwt-overlay" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {tanks.map((t) => (
        <rect
          key={`tank-${t.id}`}
          className="hwt-tank-zone"
          data-tank-id={t.id}
          data-side={t.side}
          x={Math.max(0, t.pos.col - 1) * (CELL + GAP) - 1}
          y={Math.max(0, t.pos.row - 1) * (CELL + GAP) - 1}
          width={(Math.min(battle.grid.cols - 1, t.pos.col + 1) - Math.max(0, t.pos.col - 1) + 1) * (CELL + GAP) - GAP + 2}
          height={(Math.min(battle.grid.rows - 1, t.pos.row + 1) - Math.max(0, t.pos.row - 1) + 1) * (CELL + GAP) - GAP + 2}
          rx="12"
        />
      ))}
      {healRing && (
        <rect
          className="hwt-heal-ring"
          data-reach={healRing.r}
          x={healRing.c0 * (CELL + GAP) - 2}
          y={healRing.r0 * (CELL + GAP) - 2}
          width={(healRing.c1 - healRing.c0 + 1) * (CELL + GAP) - GAP + 4}
          height={(healRing.r1 - healRing.r0 + 1) * (CELL + GAP) - GAP + 4}
          rx="14"
        />
      )}
      {pairs.map(({ enemyId, targetId }) => {
        const e = byId.get(enemyId)
        const t = byId.get(targetId)
        if (!e || !t) return null
        const a = cellCenter(e.pos)
        const c = cellCenter(t.pos)
        // Stop at the target token's edge so the end dot stays visible.
        const len = Math.hypot(c.x - a.x, c.y - a.y) || 1
        const b = { x: c.x - ((c.x - a.x) / len) * 40, y: c.y - ((c.y - a.y) / len) * 40 }
        return (
          <g key={`aggro-${enemyId}`}>
            <line className="hwt-aggro-line" data-enemy-id={enemyId} data-target-id={targetId} data-target-role={roleOf(t)} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            <circle className="hwt-aggro-end" data-target-role={roleOf(t)} cx={b.x} cy={b.y} r="5" />
          </g>
        )
      })}
      {hoverPath && selected && (
        <g className="hwt-path" data-band={hoverPath.band} data-ap-cost={hoverPath.apCost}>
          <polyline points={hoverPath.path.map((p) => `${cellCenter(p).x},${cellCenter(p).y}`).join(" ")} />
          {(() => {
            const end = cellCenter(hoverPath.path[hoverPath.path.length - 1])
            return (
              <g className="hwt-path-cost">
                <circle cx={end.x} cy={end.y} r="15" />
                <text x={end.x} y={end.y + 5} textAnchor="middle">
                  {hoverPath.apCost} AP
                </text>
              </g>
            )
          })()}
        </g>
      )}
    </svg>
  )
}

function SquadBar({ battle, selectedId, onSelect }) {
  const squad = battle.units.filter((u) => u.side === "player" && !u.npc && !u.structure)
  if (!squad.length) return null
  return (
    <div className="hwt-sb-bar" role="toolbar" aria-label="Your squad">
      {squad.map((u) => {
        const role = BATTLE_ROLES[roleOf(u)]
        const alive = u.hp > 0
        return (
          <button
            key={u.id}
            type="button"
            className="hwt-sb-slot"
            data-unit-id={u.id}
            data-role={role.id}
            data-selected={u.id === selectedId}
            data-dead={!alive}
            data-spent={alive && u.ap <= 0}
            disabled={!alive}
            title={roleTitle(u)}
            onClick={() => onSelect(u)}
          >
            <span className="hwt-sb-portrait">
              <TokenArt unit={u} />
              <span className="hwt-sb-role" aria-hidden="true">
                {role.icon}
              </span>
            </span>
            <span className="hwt-sb-info">
              <span className="hwt-sb-name">{u.name}</span>
              <span className="hwt-sb-role-name">{role.label}</span>
              <span className="hwt-sb-hp" title={`${u.hp}/${u.maxHp} HP`}>
                <span className="hwt-sb-hp-fill" style={{ width: `${Math.max(0, Math.round((u.hp / u.maxHp) * 100))}%` }} />
                <span className="hwt-sb-hp-num">
                  {u.hp}/{u.maxHp}
                </span>
              </span>
              {hasMana(u) && (
                <span className="hwt-sb-mana" title={manaSummary(u)}>
                  <ManaBar unit={u} battle={battle} className="hwt-sb-mana-track" />
                  <span className="hwt-sb-mana-num">
                    {u.mana}
                    {u.overcharge > 0 ? `+${u.overcharge}` : ""}/{u.manaMax}
                  </span>
                </span>
              )}
              <span className="hwt-sb-ap" title={`${u.ap}/${u.apMax} AP`}>
                {Array.from({ length: u.apMax }, (_, i) => (
                  <span key={i} className="hwt-sb-ap-pip" data-full={i < u.ap} />
                ))}
                {u.overwatch > 0 && <span className="hwt-sb-state" title="On Overwatch">👁</span>}
                {u.hunkered > 0 && <span className="hwt-sb-state" title="Hunkered down">🛡</span>}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default function TacticsBoard({
  battle,
  onBattleChange,
  selectedId,
  onSelectedIdChange,
  abilityMode,
  onAbilityModeChange,
  resultActions,
  children,
}) {
  const selected = battle.units.find((u) => u.id === selectedId) || null
  // Class system: abilityMode is "heal"/"burst" for the signature ability,
  // "ally@<skillId>"/"enemy@<skillId>" for an armed class skill.
  const armedSkillId = abilityMode && abilityMode.includes("@") ? abilityMode.slice(abilityMode.indexOf("@") + 1) : null
  const armedSide =
    abilityMode === "heal" || abilityMode?.startsWith("ally@")
      ? "ally"
      : abilityMode === "burst" || abilityMode?.startsWith("enemy@")
        ? "enemy"
        : abilityMode?.startsWith("tile@")
          ? "tile"
          : null
  const armedSkill = armedSkillId ? [...(selected?.classSkills || []), ...(selected?.rangedKit || [])].find((sk) => sk.id === armedSkillId) || null : null
  // Deployment phase: the enemy's plan and zones are shown as if it were
  // player turn 1 (a scratch copy - the real battle stays in "deploy").
  const deploying = battle.phase === "deploy"
  const showPlan = battle.phase === "player" || deploying
  const planBattle = useMemo(() => (deploying ? { ...battle, phase: "player" } : battle), [battle, deploying])
  // Battle feel round: a unit that just fell stays on its tile, faded,
  // for a moment - so its killing blow (replayed by TacticsFx) lands on
  // something visible instead of an already-empty cell.
  const [fallenIds, setFallenIds] = useState(() => new Set())
  const prevHpRef = useRef(null)
  useEffect(() => {
    const prev = prevHpRef.current
    prevHpRef.current = new Map(battle.units.map((u) => [u.id, u.hp]))
    if (!prev) return undefined
    const newlyFallen = battle.units.filter((u) => u.hp <= 0 && (prev.get(u.id) || 0) > 0).map((u) => u.id)
    if (!newlyFallen.length) return undefined
    setFallenIds((cur) => new Set([...cur, ...newlyFallen]))
    const timer = setTimeout(() => {
      setFallenIds((cur) => new Set([...cur].filter((id) => !newlyFallen.includes(id))))
    }, FALLEN_LINGER_MS)
    return () => clearTimeout(timer)
  }, [battle])
  // Battlefield sprint: floating "-N" on a struck barricade, "Wall breaks!" when it falls.
  const [wallFx, setWallFx] = useState([])
  const prevWallsRef = useRef(null)
  const wallFxIdRef = useRef(0)
  useEffect(() => {
    const walls = new Map()
    for (const [key, t] of Object.entries(battle.terrain || {})) if (t === "wall") walls.set(key, battle.wallHp?.[key] ?? WALL_MAX_HP)
    const prev = prevWallsRef.current
    prevWallsRef.current = walls
    if (!prev) return undefined
    const fresh = []
    for (const [key, hp] of prev) {
      if (!walls.has(key)) fresh.push({ id: wallFxIdRef.current++, key, kind: "break", text: "Wall breaks!" })
      else if (walls.get(key) < hp) fresh.push({ id: wallFxIdRef.current++, key, kind: "hit", text: `-${hp - walls.get(key)}` })
    }
    if (!fresh.length) return undefined
    setWallFx((cur) => [...cur, ...fresh])
    const ids = new Set(fresh.map((f) => f.id))
    const timer = setTimeout(() => setWallFx((cur) => cur.filter((f) => !ids.has(f.id))), 1600)
    return () => clearTimeout(timer)
  }, [battle])
  // Destructibles: tile callouts ("Timber!", "Boom!") + fall animation from the engine's object events.
  const [objFx, setObjFx] = useState([])
  const objSeqRef = useRef(null)
  useEffect(() => {
    if (objSeqRef.current === null || (battle.eventSeq || 0) < objSeqRef.current) {
      objSeqRef.current = battle.eventSeq || 0
      return undefined
    }
    const fresh = (battle.events || []).filter((e) => e.seq > objSeqRef.current && e.kind === "object")
    objSeqRef.current = battle.eventSeq || objSeqRef.current
    if (!fresh.length) return undefined
    const items = fresh.map((e) => ({ id: e.seq, key: `${e.pos.row}-${e.pos.col}`, fx: e.fx, text: e.label, dir: e.dir }))
    setObjFx((cur) => [...cur, ...items])
    const ids = new Set(items.map((f) => f.id))
    const timer = setTimeout(() => setObjFx((cur) => cur.filter((f) => !ids.has(f.id))), 1700)
    return () => clearTimeout(timer)
  }, [battle])
  // Telegraph: tiles a burning tree scorches / trees it spreads to when the turn ends.
  const fireWarn = useMemo(() => {
    const keys = new Set()
    for (const key of Object.keys(battle.objFire || {})) {
      const [r, c] = key.split("-").map(Number)
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) keys.add(`${r + dr}-${c + dc}`)
    }
    return keys
  }, [battle.objFire])
  const reachable = useMemo(
    () => (selected && selected.ap > 0 && !abilityMode && battle.phase === "player" ? reachableTilesFor(battle, selected.id) : []),
    [battle, selected, abilityMode],
  )
  // XCOM part 1: blue (can still act) / yellow (dash, turn spent) tiles.
  const moveOptions = useMemo(
    () => (selected && selected.side === "player" && selected.ap > 0 && !abilityMode && battle.phase === "player" ? moveOptionsFor(battle, selected.id) : new Map()),
    [battle, selected, abilityMode],
  )
  const [hoverKey, setHoverKey] = useState(null)
  const hoverPath = useMemo(() => {
    if (!hoverKey || !selected || !moveOptions.has(hoverKey)) return null
    return movePathFor(battle, selected.id, moveOptions.get(hoverKey).pos, moveOptions)
  }, [hoverKey, selected, moveOptions, battle])
  // XCOM part 2: hit % + damage for the hovered target; cover shields.
  const rolling = rollsOn(battle)
  const [hoverTargetId, setHoverTargetId] = useState(null)
  const hitPreview = useMemo(() => {
    if (!hoverTargetId || !selected || selected.side !== "player" || battle.phase !== "player") return null
    const t = battle.units.find((u) => u.id === hoverTargetId)
    if (!t || t.hp <= 0 || t.side === selected.side) return null
    return { ...attackPreview(battle, selected.id, hoverTargetId, { skill: armedSkill }), targetName: t.name, skill: !!abilityMode }
  }, [hoverTargetId, selected, battle, abilityMode, armedSkill])
  // Ranged rework: preview tiles while targeting - a beam's line, a
  // grenade / smoke blast (tile skills), an arcing area spell's splash.
  const [hoverSkillTile, setHoverSkillTile] = useState(null)
  const shotPreview = useMemo(() => {
    const out = new Map()
    if (!selected || !armedSkill || battle.phase !== "player") return out
    if (armedSkill.beam && hoverTargetId) {
      const t = battle.units.find((u) => u.id === hoverTargetId)
      if (t) for (const p of beamTiles(battle, selected.pos, t.pos, armedSkill.range)) out.set(`${p.row}-${p.col}`, "beam")
    } else if (armedSide === "tile" && AREA_TILE_SKILLS[armedSkill.id] && hoverSkillTile) {
      const [row, col] = hoverSkillTile.split("-").map(Number)
      for (const p of blastTiles(battle, { row, col })) out.set(`${p.row}-${p.col}`, AREA_TILE_SKILLS[armedSkill.id])
    } else if (armedSide === "enemy" && (armedSkill.area || armedSkill.indirect) && hoverTargetId) {
      const t = battle.units.find((u) => u.id === hoverTargetId)
      if (t) for (const p of blastTiles(battle, t.pos)) out.set(`${p.row}-${p.col}`, "arc")
    }
    return out
  }, [selected, armedSkill, armedSide, hoverTargetId, hoverSkillTile, battle])
  const hoverCover = useMemo(() => (rolling && hoverKey && moveOptions.has(hoverKey) ? tileCoverSides(battle, moveOptions.get(hoverKey).pos) : null), [rolling, hoverKey, moveOptions, battle])
  // Each unit's cover: an enemy vs your selected unit; yours vs the enemies that can reach it.
  const unitCover = useMemo(() => {
    const out = new Map()
    if (!rolling || !selected || selected.side !== "player" || battle.phase !== "player") return out
    const foes = battle.units.filter((u) => u.side === "enemy" && u.hp > 0 && !u.structure && u.attack > 0)
    for (const u of battle.units) {
      if (u.hp <= 0 || u.structure) continue
      if (u.side === "enemy") {
        out.set(u.id, { level: coverAgainst(battle, u.pos, selected.pos, { hunkered: u.hunkered > 0 }), flanked: isFlanked(battle, u.pos, selected.pos), vs: selected.name })
      } else if (!u.npc) {
        const near = foes.filter((f) => Math.max(Math.abs(f.pos.row - u.pos.row), Math.abs(f.pos.col - u.pos.col)) <= (f.move || 0) + rangeAt(battle, f) + 1)
        if (!near.length) continue
        const levels = near.map((f) => coverAgainst(battle, u.pos, f.pos, { hunkered: u.hunkered > 0 }))
        out.set(u.id, { level: Math.min(...levels), flanked: near.some((f) => isFlanked(battle, u.pos, f.pos)), vs: "the enemies that can reach it" })
      }
    }
    return out
  }, [rolling, selected, battle])
  // Healer range ring: every tile a selected healer's heals can reach.
  const healRing = useMemo(() => {
    const keys = new Set()
    if (!selected || selected.side !== "player" || roleOf(selected) !== "healer" || battle.phase !== "player") return keys
    const r = healReach(selected)
    for (let row = selected.pos.row - r; row <= selected.pos.row + r; row++) {
      for (let col = selected.pos.col - r; col <= selected.pos.col + r; col++) {
        if (row >= 0 && col >= 0 && row < battle.grid.rows && col < battle.grid.cols) keys.add(`${row}-${col}`)
      }
    }
    return keys
  }, [battle, selected])
  const targets = useMemo(
    () =>
      selected && selected.ap > 0 && battle.phase === "player" && armedSide !== "ally" && armedSide !== "tile"
        ? armedSide === "enemy"
          ? abilityTargets(battle, selected.id, armedSkillId || undefined)
          : attackableTargets(battle, selected.id)
        : [],
    [battle, selected, armedSide, armedSkillId],
  )
  // Ability-only highlight: the allies an armed ally-targeting ability
  // (heal / shield-ally) can pick - "heal" mode, "burst" mode = enemies.
  const healable = useMemo(
    () => (selected && armedSide === "ally" && battle.phase === "player" ? abilityTargets(battle, selected.id, armedSkillId || undefined) : []),
    [battle, selected, armedSide, armedSkillId],
  )
  // Class skills that target a board tile (traps, walls, turrets...).
  const skillTiles = useMemo(
    () => (selected && armedSide === "tile" && armedSkill && battle.phase === "player" ? classSkillTiles(battle, selected.id, armedSkill) : []),
    [battle, selected, armedSide, armedSkill],
  )
  // What every living enemy currently plans to do this coming enemy phase -
  // recomputed fresh from the live board each render, so it's always exactly
  // what will happen if the player ends the turn right now, never a stale
  // guess. See tacticsEngine.js's previewEnemyIntents for the accuracy proof.
  const intents = useMemo(
    () => (showPlan ? previewEnemyIntents(planBattle) : []),
    [planBattle, showPlan],
  )
  const intentByEnemyId = useMemo(() => new Map(intents.map((i) => [i.enemyId, i.intent])), [intents])
  const aggro = useMemo(() => (battle.phase === "player" ? aggroPairs(battle, intents) : []), [battle, intents])
  // Wanderers: where each striking skirmisher will fade to (dotted marker).
  const fadeTiles = useMemo(() => new Set(intents.filter((i) => i.intent.fadeTo).map((i) => `${i.intent.fadeTo.row}-${i.intent.fadeTo.col}`)), [intents])
  const threatenedIds = useMemo(() => {
    const ids = new Set()
    for (const { intent: raw } of intents) {
      // Enemy skills: Frenzy wraps the real follow-up action in `then`.
      const intent = raw.then || raw
      if (intent.kind === "attack" || intent.kind === "move-attack") ids.add(intent.targetId)
      if (intent.kind === "skill" && ["hex", "pounce", "suppress", "spot", "volley"].includes(intent.skillKind)) ids.add(intent.targetId)
      if (intent.kind === "skill" && intent.tiles) {
        for (const p of battle.units) {
          if (p.side === "player" && p.hp > 0 && intent.tiles.some((t) => t.row === p.pos.row && t.col === p.pos.col)) ids.add(p.id)
        }
      }
      // The final boss's real AoE - unlike a single-target attack, it
      // hits every living player unit at once, so every one of them is
      // threatened, not just one chosen target.
      if (intent.kind === "aoe") {
        for (const p of battle.units) {
          if (p.side === "player" && p.hp > 0) ids.add(p.id)
        }
      }
    }
    return ids
  }, [intents, battle])
  // Same idea, for the Ancients' telegraphed AoE: whether ending the turn
  // right now lands the payoff, and on whom. Distinct from the per-target
  // intent above since a charge payoff hits every living player unit at
  // once, not a single chosen target.
  const chargeThreat = useMemo(
    () => (showPlan ? previewChargeThreat(planBattle) : { enemyIds: [], playerIds: [] }),
    [planBattle, showPlan],
  )
  const chargeThreatenedIds = useMemo(() => new Set(chargeThreat.playerIds), [chargeThreat])
  // Enemy skills: tiles a slam will crush ("release") or is aiming at ("windup").
  const skillZone = useMemo(() => {
    const zone = new Map()
    for (const { intent } of intents) {
      if (intent.kind !== "skill" || !intent.tiles) continue
      for (const t of intent.tiles) {
        const key = `${t.row}-${t.col}`
        if (zone.get(key) !== "release") zone.set(key, intent.phase)
      }
    }
    return zone
  }, [intents])
  const chargeFiringIds = useMemo(() => new Set(chargeThreat.enemyIds), [chargeThreat])
  // Zone of Control round: a static board property (which tiles are
  // dangerous to retreat FROM), not relative to whichever unit is
  // currently selected - visible throughout the player's own turn,
  // same phase-gating as the charge/intent telegraphs above.
  const zocCells = useMemo(() => (showPlan ? zoneOfControlCells(planBattle, "enemy") : new Set()), [planBattle, showPlan])
  // Threat Zone round: same static, phase-gated pattern as zocCells
  // above - a separate set since a cell can be in one, both, or
  // neither (the 2 mechanics are additive, not mutually exclusive).
  const threatCells = useMemo(() => (showPlan ? threatZoneCells(planBattle, "enemy") : new Set()), [planBattle, showPlan])
  // Fear Zone round: same static, phase-gated pattern as zocCells/
  // threatCells above - a separate set since a cell can be in any
  // combination of the 3 zone types at once (they're additive, not
  // mutually exclusive).
  const fearCells = useMemo(() => (showPlan ? fearZoneCells(planBattle, "enemy") : new Set()), [planBattle, showPlan])
  // Frost Zone round: same static, phase-gated pattern as the 3 zone
  // sets above - side "player" here, not "enemy", since this round's
  // one real hand-authored example (frostbind) is a PLAYER unit (no
  // enemy carries any cold/ice flavor today) - a deliberate, stated
  // flip from every prior zone overlay.
  const frostCells = useMemo(() => (showPlan ? frostZoneCells(planBattle, "player") : new Set()), [planBattle, showPlan])
  // Thorn Zone round: back to side "enemy" like every zone type
  // except Frost Zone's own player-side flip - rootbind-thicket is an
  // enemy.
  const thornCells = useMemo(() => (showPlan ? thornZoneCells(planBattle, "enemy") : new Set()), [planBattle, showPlan])

  // Battle objectives: panel text, reinforcement warning tiles, pulse timer.
  const objective = describeObjective(battle)
  const reinforceTiles = useMemo(() => new Set(reinforcementWarningTiles(battle).map((p) => `${p.row}-${p.col}`)), [battle])
  const pulseIn = turnsUntilPulse(battle)
  const bossInfo = describeBoss(battle)
  const bossWarn = useMemo(() => bossWarningTiles(battle), [battle])
  // Factions (sprint 3): banner + Blight tiles (now / just spread / next).
  const factionView = describeFaction(battle)
  const blightFresh = useMemo(() => new Set(battle.blightFresh || []), [battle])
  const blightNext = useMemo(() => new Set(blightPreviewKeys(battle)), [battle])

  const cellUnit = (row, col) => battle.units.find((u) => u.pos.row === row && u.pos.col === col && u.hp > 0)
  const fallenHere = (row, col) => battle.units.find((u) => u.pos.row === row && u.pos.col === col && u.hp <= 0 && fallenIds.has(u.id))
  const isReachable = (row, col) => reachable.some((p) => p.row === row && p.col === col)
  // A cell's own terrain type - an omitted entry (every pre-terrain
  // formation, and every cell not named in a formation's own terrain
  // map) defaults to "path", the exact same fallback tacticsEngine.js's
  // own terrainAt uses.
  const terrainHere = (row, col) => battle.terrain?.[`${row}-${col}`] || "path"
  // Battlefield sprint: barricades the selected unit can hit / an enemy plans to hit.
  const wallTargets = useMemo(
    () => (selected && selected.side === "player" && battle.phase === "player" && !abilityMode ? wallTargetsFor(battle, selected.id) : []),
    [battle, selected, abilityMode],
  )
  const wallTargetHere = (row, col) => wallTargets.some((p) => p.row === row && p.col === col)
  const wallThreat = useMemo(() => {
    const keys = new Set()
    for (const { intent } of intents) if (intent.kind === "wall") keys.add(`${intent.pos.row}-${intent.pos.col}`)
    return keys
  }, [intents])
  // Present feature types, for the small battlefield legend.
  const terrainKinds = useMemo(() => [...new Set(Object.values(battle.terrain || {}))].filter((t) => TERRAIN_INFO[t]), [battle.terrain])
  const targetHere = (row, col) => targets.find((t) => t.pos.row === row && t.pos.col === col)
  const healableHere = (row, col) => healable.find((u) => u.pos.row === row && u.pos.col === col)

  function handleDeployClick(row, col) {
    const occupant = cellUnit(row, col)
    if (selected && selected.side === "player") {
      if (occupant && occupant.id === selected.id) {
        onSelectedIdChange(null)
        return
      }
      const placed = placeUnit(battle, selected.id, { row, col })
      if (placed !== battle) {
        onBattleChange(placed)
        onSelectedIdChange(null)
        return
      }
    }
    onSelectedIdChange(occupant && occupant.side === "player" && !occupant.npc ? occupant.id : null)
  }

  function handleBegin() {
    onSelectedIdChange(null)
    onAbilityModeChange(null)
    onBattleChange(beginBattle(battle))
  }

  function handleCellClick(row, col) {
    if (deploying) {
      handleDeployClick(row, col)
      return
    }
    if (battle.phase !== "player") return

    if (selected && armedSide === "ally") {
      const healTarget = healableHere(row, col)
      if (healTarget) onBattleChange(castAbility(battle, selected.id, healTarget.id, armedSkillId || undefined))
      onAbilityModeChange(null)
      return
    }

    if (selected && armedSide === "tile") {
      if (skillTiles.some((p) => p.row === row && p.col === col)) onBattleChange(castAbility(battle, selected.id, `${row}-${col}`, armedSkillId))
      onAbilityModeChange(null)
      return
    }

    if (selected && armedSide === "enemy") {
      const target = targetHere(row, col)
      if (target) onBattleChange(castAbility(battle, selected.id, target.id, armedSkillId || undefined))
      onAbilityModeChange(null)
      return
    }

    const target = targetHere(row, col)
    if (selected && target) {
      onBattleChange(attackUnit(battle, selected.id, target.id))
      return
    }
    if (selected && wallTargetHere(row, col)) {
      onBattleChange(attackWall(battle, selected.id, { row, col }))
      return
    }
    if (selected && isReachable(row, col)) {
      onBattleChange(moveUnit(battle, selected.id, { row, col }))
      return
    }
    // XCOM part 1: a yellow dash tile = two real moves in a row.
    if (selected && moveOptions.get(`${row}-${col}`)?.dash) {
      setHoverKey(null)
      onBattleChange(dashMove(battle, selected.id, { row, col }))
      return
    }
    const occupant = cellUnit(row, col)
    if (occupant && occupant.hp > 0 && occupant.side === "player" && occupant.ap > 0) {
      onSelectedIdChange(occupant.id)
    } else {
      onSelectedIdChange(null)
    }
    onAbilityModeChange(null)
  }

  function handleAbilityClick() {
    if (!selected || !selected.ability || battle.phase !== "player") return
    const ability = selected.ability
    if (selected.ap < ability.cost || selected.cooldownRemaining > 0 || !canAfford(selected, ability)) return
    const side = abilityTargetSide(ability)
    if (!side) {
      onBattleChange(castAbility(battle, selected.id))
      onAbilityModeChange(null)
      return
    }
    const kind = side === "ally" ? "heal" : "burst"
    onAbilityModeChange(abilityMode === kind ? null : kind)
  }

  // Class skill button: instant for self skills, otherwise arm targeting.
  function handleSkillClick(skill) {
    if (!selected || battle.phase !== "player" || !classSkillUsable(battle, selected, skill)) return
    if (skill.target === "self") {
      onBattleChange(castAbility(battle, selected.id, null, skill.id))
      onAbilityModeChange(null)
      return
    }
    const mode = `${skill.target === "ally" || skill.target === "tile" ? skill.target : "enemy"}@${skill.id}`
    onAbilityModeChange(abilityMode === mode ? null : mode)
  }

  // Keys 1-4: 1 = signature ability, 2+ = class skills.
  const skillKeysRef = useRef(null)
  skillKeysRef.current = { selected, handleAbilityClick, handleSkillClick }
  useEffect(() => {
    function onKey(e) {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return
      const n = Number(e.key)
      if (!(n >= 1 && n <= 4)) return
      const { selected: sel, handleAbilityClick: sig, handleSkillClick: cls } = skillKeysRef.current
      if (!sel || sel.side !== "player") return
      const list = [...(sel.ability ? [null] : []), ...(sel.classSkills || [])]
      const pick = list[n - 1]
      if (pick === undefined) return
      if (pick === null) sig()
      else cls(pick)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // XCOM part 1: universal Overwatch / Hunker Down (both end the unit's turn).
  function handleUniversal(kind) {
    if (!selected || battle.phase !== "player" || selected.ap < 1) return
    onAbilityModeChange(null)
    onBattleChange(kind === "overwatch" ? overwatchAction(battle, selected.id) : hunkerDown(battle, selected.id))
  }

  // Mana: drink a carried mana potion (1 AP).
  function handlePotion() {
    if (!selected || battle.phase !== "player") return
    onAbilityModeChange(null)
    onBattleChange(drinkPotion(battle, selected.id))
  }

  function handleSquadSelect(u) {
    if (u.hp <= 0) return
    if (deploying || (battle.phase === "player" && u.ap > 0)) {
      onAbilityModeChange(null)
      onSelectedIdChange(u.id)
    }
  }

  function handleActivePower() {
    onAbilityModeChange(null)
    onBattleChange(activateCommanderPower(battle))
  }

  function handleEndTurn() {
    onSelectedIdChange(null)
    onAbilityModeChange(null)
    onBattleChange(endPlayerTurn(battle))
  }

  const cells = []
  for (let row = 0; row < battle.grid.rows; row++) {
    for (let col = 0; col < battle.grid.cols; col++) {
      const unit = cellUnit(row, col)
      const reach = selected && isReachable(row, col)
      const target = selected && targetHere(row, col)
      const healTarget = selected && healableHere(row, col)
      const threatened = unit && unit.side === "player" && (threatenedIds.has(unit.id) || chargeThreatenedIds.has(unit.id))
      const intent = unit && unit.side === "enemy" ? intentByEnemyId.get(unit.id) : null
      const terrain = terrainHere(row, col)
      const zoc = zocCells.has(`${row}-${col}`)
      const threatZone = threatCells.has(`${row}-${col}`)
      const fearZone = fearCells.has(`${row}-${col}`)
      const frostZone = frostCells.has(`${row}-${col}`)
      const thornZone = thornCells.has(`${row}-${col}`)
      const deployZone = deploying && isDeployTile(battle, { row, col })
      const moveOpt = selected ? moveOptions.get(`${row}-${col}`) : null
      const onPath = hoverPath && hoverPath.path.some((p) => p.row === row && p.col === col)
      const skillTileHere = skillTiles.some((p) => p.row === row && p.col === col)
      const smokeTurns = battle.smoke?.[`${row}-${col}`] || 0
      cells.push(
        <div
          key={`${row}-${col}`}
          className="hwt-cell"
          data-cell={`${row}-${col}`}
          data-reachable={!!reach}
          data-move-band={moveOpt ? moveOpt.band : undefined}
          data-move-cost={moveOpt ? moveOpt.apCost : undefined}
          data-dash={moveOpt?.dash || undefined}
          data-heal-ring={healRing.has(`${row}-${col}`) || undefined}
          data-path={onPath || undefined}
          onMouseEnter={moveOpt ? () => setHoverKey(`${row}-${col}`) : target && unit ? () => setHoverTargetId(unit.id) : skillTileHere ? () => setHoverSkillTile(`${row}-${col}`) : undefined}
          onMouseLeave={
            moveOpt
              ? () => setHoverKey((k) => (k === `${row}-${col}` ? null : k))
              : target && unit
                ? () => setHoverTargetId((id) => (id === unit.id ? null : id))
                : skillTileHere
                  ? () => setHoverSkillTile((k) => (k === `${row}-${col}` ? null : k))
                  : undefined
          }
          data-shot-preview={shotPreview.get(`${row}-${col}`) || undefined}
          data-smoke={smokeTurns || undefined}
          data-hover-cover={(hoverCover && hoverKey === `${row}-${col}`) || undefined}
          data-targetable={!!target}
          data-healable={!!healTarget}
          data-skill-tile={skillTiles.some((p) => p.row === row && p.col === col) || undefined}
          data-trap={battle.classTraps?.[`${row}-${col}`]?.kind || undefined}
          data-threatened={!!threatened}
          data-skill-zone={skillZone.get(`${row}-${col}`) || undefined}
          data-terrain={terrain}
          data-art={terrainArtStyle(terrain) ? terrain : undefined}
          style={terrainArtStyle(terrain)}
          data-zoc={zoc}
          data-threat-zone={threatZone}
          data-fear-zone={fearZone}
          data-frost-zone={frostZone}
          data-thorn-zone={thornZone}
          data-deploy-zone={deployZone}
          data-reinforce={reinforceTiles.has(`${row}-${col}`)}
          data-boss-warn={bossWarn.get(`${row}-${col}`) || undefined}
          data-blight={!!battle.blight?.[`${row}-${col}`] || undefined}
          data-blight-fresh={blightFresh.has(`${row}-${col}`) || undefined}
          data-blight-next={blightNext.has(`${row}-${col}`) || undefined}
          data-fade-to={fadeTiles.has(`${row}-${col}`) || undefined}
          data-wall-targetable={isAttackableTile(terrain) && wallTargetHere(row, col)}
          data-wall-threat={isAttackableTile(terrain) && wallThreat.has(`${row}-${col}`)}
          data-object={OBJECTS[terrain] ? terrain : undefined}
          data-burning={(OBJECTS[terrain] && isBurning(battle, { row, col })) || undefined}
          data-brittle={(terrain === "icepillar" && isChilled(battle, { row, col })) || undefined}
          data-fire-warn={(fireWarn.has(`${row}-${col}`) && !isBurning(battle, { row, col })) || undefined}
          title={
            (smokeTurns ? `Smoke (${smokeTurns} turn(s) left): anyone here counts as in half cover from every side against ranged attacks.` : "") ||
            describeObjectTile(battle, { row, col }) ||
            (TERRAIN_INFO[terrain]
              ? `${TERRAIN_INFO[terrain].name}: ${TERRAIN_INFO[terrain].text}${terrain === "wall" ? ` (${wallHpAt(battle, { row, col })}/${WALL_MAX_HP} HP)` : ""}${battle.tileTimers?.[`${row}-${col}`] && (terrain === "fire" || terrain === "poison") ? ` Fades in ${battle.tileTimers[`${row}-${col}`].turns} turn(s).` : ""}`
              : undefined)
          }
          data-deploy-target={deployZone && !!selected && (!unit || (unit.side === "player" && unit.id !== selected.id))}
          onClick={() => handleCellClick(row, col)}
        >
          {hoverCover && hoverKey === `${row}-${col}` &&
            Object.entries(hoverCover)
              .filter(([, v]) => v > 0)
              .map(([side, v]) => (
                <span key={side} className="hwt-cover-shield" data-side={side} data-cover={v === 2 ? "full" : "half"} title={`${v === 2 ? "Full" : "Half"} cover from the ${{ N: "north", S: "south", E: "east", W: "west" }[side]} (-${v === 2 ? 40 : 20}% to be hit)`}>
                  <ShieldIcon full={v === 2} />
                </span>
              ))}
          {hoverCover && hoverKey === `${row}-${col}` && !Object.values(hoverCover).some((v) => v > 0) && (
            <span className="hwt-cover-open" title="No cover here - exposed from every side">
              Open
            </span>
          )}
          {unit && hitPreview && hoverTargetId === unit.id && (
            <span
              className="hwt-hit-badge"
              data-hit={hitPreview.chance}
              data-tier={hitPreview.chance >= 75 ? "good" : hitPreview.chance >= 45 ? "fair" : "poor"}
              title={hitPreview.parts.map((p) => (p.value === 0 && p !== hitPreview.parts[0] ? p.label : `${p.label} ${p.value > 0 && p !== hitPreview.parts[0] ? "+" : ""}${p.value}%`)).join(" · ")}
            >
              <b>{hitPreview.chance}%</b>
              {hitPreview.skill ? (hitPreview.rolls ? <small> · miss = graze (half)</small> : null) : <> · {hitPreview.full}{hitPreview.rolls && <small> (graze {hitPreview.graze})</small>}</>}
            </span>
          )}
          {smokeTurns > 0 && (
            <span className="hwt-smoke" data-turns={smokeTurns}>
              <SmokeArt turns={smokeTurns} />
            </span>
          )}
          {battle.classTraps?.[`${row}-${col}`] && (
            <span className="hwt-trap-icon" title={battle.classTraps[`${row}-${col}`].kind === "thorn" ? "Your hidden Thorn Trap" : "Your hidden Poison Mine"}>
              {battle.classTraps[`${row}-${col}`].kind === "thorn" ? "✳" : "☣"}
            </span>
          )}
          {(battle.classCharges || []).some((c) => c.row === row && c.col === col) && (
            <span className="hwt-charge-icon" title="Explosive Charge - blows when you end the turn">
              ✹
            </span>
          )}
          {bossWarn.has(`${row}-${col}`) && <span className="hwt-boss-warn-icon">{BOSS_WARN_ICON[bossWarn.get(`${row}-${col}`)] || "!"}</span>}
          {terrain === "wall" && (
            <span className="hwt-wall-hp" title={`Barricade ${wallHpAt(battle, { row, col })}/${WALL_MAX_HP} HP`}>
              <span className="hwt-wall-hp-fill" style={{ width: `${Math.round((wallHpAt(battle, { row, col }) / WALL_MAX_HP) * 100)}%` }} />
              <span className="hwt-wall-hp-num">{wallHpAt(battle, { row, col })}</span>
            </span>
          )}
          {OBJECTS[terrain] && (
            <span className="hwt-object" data-object={terrain} aria-hidden="true">
              <ObjectArt type={terrain} burning={isBurning(battle, { row, col })} brittle={terrain === "icepillar" && isChilled(battle, { row, col })} />
            </span>
          )}
          {OBJECTS[terrain] && objectMaxHp(terrain) > 1 && (
            <span className="hwt-obj-pips" title={`${OBJECTS[terrain].name} ${objectHpAt(battle, { row, col })}/${objectMaxHp(terrain)} HP`}>
              {Array.from({ length: objectMaxHp(terrain) }, (_, i) => (
                <span key={i} className="hwt-obj-pip" data-full={i < objectHpAt(battle, { row, col })} />
              ))}
            </span>
          )}
          {OBJECTS[terrain] && isBurning(battle, { row, col }) && (
            <span className="hwt-obj-fire" title={`Burning - ${battle.objFire[`${row}-${col}`]} turn(s) until it collapses to ash`}>
              🔥<b>{battle.objFire[`${row}-${col}`]}</b>
            </span>
          )}
          {(terrain === "fire" || terrain === "poison") && battle.tileTimers?.[`${row}-${col}`] && (
            <span className="hwt-tile-timer">{battle.tileTimers[`${row}-${col}`].turns}</span>
          )}
          {objFx
            .filter((fx) => fx.key === `${row}-${col}`)
            .map((fx) => (
              <span key={`o${fx.id}`}>
                {fx.fx === "fall" && (
                  <span className="hwt-obj-falling" style={{ "--fall-x": fx.dir?.col || 0, "--fall-y": fx.dir?.row || 0 }}>
                    <ObjectArt type="tree" />
                  </span>
                )}
                <span className="hwt-wall-fx hwt-obj-fx" data-kind={fx.fx}>
                  {fx.text}
                </span>
              </span>
            ))}
          {wallFx
            .filter((fx) => fx.key === `${row}-${col}`)
            .map((fx) => (
              <span key={fx.id} className="hwt-wall-fx" data-kind={fx.kind}>
                {fx.text}
              </span>
            ))}
          {!unit && fallenHere(row, col) && (
            <div className="hwt-token-fallen" data-unit-id={fallenHere(row, col).id} data-side={fallenHere(row, col).side}>
              <TokenArt unit={fallenHere(row, col)} />
              <span className="hwt-token-name">{fallenHere(row, col).name}</span>
            </div>
          )}
          {unit && (
            <motion.div
              layout
              layoutId={unit.id}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="hwt-token"
              data-side={unit.side}
              data-selectable={unit.side === "player" && !unit.npc && unit.hp > 0 && (battle.phase === "player" || deploying)}
              data-npc={!!unit.npc}
              data-structure={!!unit.structure}
              data-boss={bossInfo && unit.id === battle.boss.unitId ? (bossInfo.immune ? "immune" : "exposed") : undefined}
              data-weak-point={!!unit.weakPoint}
              data-selected={unit.id === selectedId}
              data-acted={unit.ap <= 0}
              data-power-surge={unit.side === "player" && battle.activePower?.used && battle.activePower.firedTurn === battle.turn}
              data-spirit={!!unit.isSpirit}
              data-faction={unit.faction || undefined}
              data-echo={!!unit.echo || undefined}
              data-unit-id={unit.id}
              data-role={roleOf(unit)}
              data-overwatch={unit.overwatch > 0 || undefined}
              data-hunkered={unit.hunkered > 0 || undefined}
              title={roleTitle(unit)}
            >
              <TokenArt unit={unit} />
              {unitCover.has(unit.id) && (unitCover.get(unit.id).level > 0 || unitCover.get(unit.id).flanked) && (
                <span
                  className="hwt-unit-cover"
                  data-cover={unitCover.get(unit.id).level}
                  data-flanked={(unitCover.get(unit.id).level === 0 && unitCover.get(unit.id).flanked) || undefined}
                  title={unitCover.get(unit.id).level > 0 ? `${COVER_NAME[unitCover.get(unit.id).level]} vs ${unitCover.get(unit.id).vs}` : `Flanked - no cover vs ${unitCover.get(unit.id).vs}`}
                >
                  {unitCover.get(unit.id).level > 0 ? <ShieldIcon full={unitCover.get(unit.id).level >= 2} /> : "⚠"}
                </span>
              )}
              <span className="hwt-role-icon" data-role={roleOf(unit)} title={`${BATTLE_ROLES[roleOf(unit)].label}: ${BATTLE_ROLES[roleOf(unit)].what}`}>
                {BATTLE_ROLES[roleOf(unit)].icon}
              </span>
              {(unit.overwatch > 0 || unit.hunkered > 0) && (
                <span className="hwt-stance">
                  {unit.overwatch > 0 && (
                    <span className="hwt-ow-badge" title="Overwatch - shoots the first foe that ends a move in its reach">
                      👁
                    </span>
                  )}
                  {unit.hunkered > 0 && (
                    <span className="hwt-hunker-badge" title={rolling ? "Hunkered down - cover one step better until its next turn" : "Hunkered down - takes 50% less damage until its next turn"}>
                      🛡
                    </span>
                  )}
                </span>
              )}
              {unit.classId && classInfoFor(unit) && (
                <span className="hwt-token-class" data-class-id={unit.classId} title={`${classInfoFor(unit).name} - ${classInfoFor(unit).description}`}>
                  {classInfoFor(unit).icon}
                </span>
              )}
              <div className="hwt-token-status">
                {unit.id === "player-commander" && (
                  <span className="hwt-commander-badge" title={`${unit.name} - your Commander`}>
                    ♛
                  </span>
                )}
                {unit.level != null && (
                  <span
                    className="hwt-level-badge"
                    data-level={unit.level}
                    title={`Level ${unit.level}${unit.perks?.length ? " - " + unit.perks.map((id) => PERKS[id]?.name).join(", ") : ""}${unit.xpGained ? ` (+${unit.xpGained} XP this fight)` : ""}`}
                  >
                    Lv{unit.level}
                  </span>
                )}
                {unit.npc && (
                  <span className="hwt-npc-badge" title="Protect this ally - if it falls, the fight is lost">
                    ❖
                  </span>
                )}
                {unit.structure && pulseIn !== null && (
                  <span className="hwt-totem-badge" data-imminent={pulseIn === 0} title={pulseIn === 0 ? "The Totem pulses at the end of this turn!" : `The Totem pulses in ${pulseIn} turn(s)`}>
                    ✹{pulseIn}
                  </span>
                )}
                {unit.haste && (
                  <span className="hwt-haste-badge" title="Haste - attacks a second time whenever it lands an attack">
                    ⇉
                  </span>
                )}
                {unit.spiritbound && (
                  <span
                    className="hwt-spiritshift-badge"
                    data-used={!!unit.spiritShiftUsed}
                    title={
                      unit.spiritShiftUsed
                        ? "Spirit Shift - already used this round"
                        : "Spirit Shift - when attacked on the enemy's turn, swaps places with a spirit within 2 tiles, and the spirit takes the blow (once per round)"
                    }
                  >
                    ⇄
                  </span>
                )}
                {flankRole(unit.className) === "benefit" && (
                  <span className="hwt-flank-benefit-badge" title={`${unit.className} - deals +5%/+10% extra when attacking from the side/behind`}>
                    ⚔
                  </span>
                )}
                {flankRole(unit.className) === "resist" && (
                  <span className="hwt-flank-resist-badge" title={`${unit.className} - takes 5%/10% less when hit from the side/behind`}>
                    🛡
                  </span>
                )}
                <span className="hwt-ap-pips" title={`${unit.ap}/${unit.apMax} AP`}>
                  {apPips(unit)}
                </span>
                <span className="hwt-facing-badge" data-facing={unit.facing} title={`Facing ${unit.facing} - attacked from the side (+10%) or behind (+50%, a critical hit) takes more damage`}>
                  {FACING_ARROW[unit.facing]}
                </span>
                {unit.block > 0 && (
                  <span className="hwt-block-badge" title={`${unit.block} Block`}>
                    <CardGlyph name="shield" className="hwt-block-icon" />
                    {unit.block}
                  </span>
                )}
                {unit.cooldownRemaining > 0 && (
                  <span className="hwt-cooldown-badge" title={`Ability recharging - ${unit.cooldownRemaining} turn(s)`}>
                    ⏳{unit.cooldownRemaining}
                  </span>
                )}
                {unit.charge && (
                  <span
                    className="hwt-charge-badge"
                    data-imminent={chargeFiringIds.has(unit.id)}
                    title={
                      chargeFiringIds.has(unit.id)
                        ? `${unit.charge.label} lands on the whole squad this turn!`
                        : `Charging ${unit.charge.label} - ${unit.chargeCounter} turn(s) to the hit`
                    }
                  >
                    {chargeFiringIds.has(unit.id) ? "⚡!" : `⚡${unit.chargeCounter}`}
                  </span>
                )}
                {unit.attack > unit.baseAttack && (
                  <span className="hwt-strength-badge" title={`+${unit.attack - unit.baseAttack} Strength`}>
                    ▲{unit.attack - unit.baseAttack}
                  </span>
                )}
                {unit.cultRitual && (
                  <span
                    className="hwt-ritual-badge"
                    title={`Ritual gathering - ${unit.cultRitual.every - unit.ritualCharge} turn(s) to the sacrifice`}
                  >
                    ☾{unit.cultRitual.every - unit.ritualCharge}
                  </span>
                )}
                {unit.poison > 0 && (
                  <span
                    className="hwt-poison-badge"
                    title={`${unit.poison} Poison - ticks for that much damage (ignoring Block) at the top of your next turn, then decays by 1`}
                  >
                    ☠{unit.poison}
                  </span>
                )}
                {unit.execute > 0 && (
                  <span className="hwt-execute-badge" title={`Execute ${unit.execute} - deals ${unit.execute} bonus damage to a target at or below 30% HP`}>
                    †{unit.execute}
                  </span>
                )}
                {unit.shatter > 0 && (
                  <span className="hwt-shatter-badge" title={`Shatter ${unit.shatter} - deals ${unit.shatter} bonus damage to a target still holding Block`}>
                    ✕{unit.shatter}
                  </span>
                )}
                {unit.woundedFury > 0 && unit.hp < unit.maxHp * 0.5 && (
                  <span className="hwt-woundedfury-badge" title="Wounded Fury - below half HP, this hero's attacks deal +3 damage">
                    🔥
                  </span>
                )}
                {unit.weak > 0 && (
                  <span className="hwt-weak-badge" title={`Weak ${unit.weak} - this hero's own outgoing damage is cut by 25%`}>
                    ▼{unit.weak}
                  </span>
                )}
                {unit.slow > 0 && (
                  <span className="hwt-slow-badge" title={`Slow ${unit.slow} - this hero's own movement is reduced by 1 for a turn, then decays`}>
                    ❄{unit.slow}
                  </span>
                )}
                {unit.root > 0 && (
                  <span className="hwt-root-badge" title={`Root ${unit.root} - this hero cannot move at all for a turn, then decays (can still attack)`}>
                    ⛓{unit.root}
                  </span>
                )}
                {unit.suppressed > 0 && (
                  <span className="hwt-suppressed-badge" title={`Suppressed ${unit.suppressed} - this hero's own reactions (Zone of Control, Intercept, Retreat Step, Sidestep, Spirit Shift) are disabled for a turn, then decays`}>
                    ⊘{unit.suppressed}
                  </span>
                )}
                {unit.aimed > 0 && (
                  <span className="hwt-ranged-badge" data-status="aimed" title={`Aiming - the next shot gets +${AIM_BONUS}% to hit`}>
                    ◎
                  </span>
                )}
                {unit.suppressFire > 0 && (
                  <span className="hwt-ranged-badge" data-status="suppress" title={`Suppressed by ${getUnitName(battle, unit.suppressBy)} - -${SUPPRESS_PENALTY}% to hit, no Aim or Overwatch, and moving draws a shot`}>
                    ⁂
                  </span>
                )}
                {unit.mark > 0 && (
                  <span className="hwt-ranged-badge" data-status="marked" title={`Marked - counts as having NO cover${unit.side === "enemy" && unit.markBonus ? `, and your heroes' hits on it deal +${unit.markBonus}` : " against enemy shots"} (${unit.mark} turn(s))`}>
                    ⌖
                  </span>
                )}
                {unit.bulwark > 0 && (
                  <span className="hwt-bulwark-badge" title={`Bulwark ${unit.bulwark} - permanent armour, absorbs that much off every hit and never runs out`}>
                    ⛰{unit.bulwark}
                  </span>
                )}
                {unit.regen > 0 && (
                  <span className="hwt-regen-badge" title={`Regen ${unit.regen} - heals that much at the top of its next turn, then decays by 1`}>
                    ♥{unit.regen}
                  </span>
                )}
                {unit.taunt > 0 && (
                  <span className="hwt-taunt-badge" title="Taunt - while this is alive, it's the ONLY valid attack target on its side">
                    ⚑{unit.taunt}
                  </span>
                )}
                {unit.revive > 0 && (
                  <span className="hwt-revive-badge" title={`Revive ${unit.revive} - the next hit that would drop this to 0 HP instead leaves it at 1, consuming one stack`}>
                    ✚{unit.revive}
                  </span>
                )}
                <ElementBadges unit={unit} />
                {unit.side === "enemy" && factionInfo(unit.faction) && (
                  <span className="hwt-faction-badge" data-faction={unit.faction} title={`${factionInfo(unit.faction).tag}${unit.skirmisher ? " - strikes, then fades up to 2 tiles back" : ""}${unit.echo ? " - an echo of your own hero" : ""}`}>
                    {factionInfo(unit.faction).icon}
                  </span>
                )}
                {unit.faction === "corrupted" && isBlighted(battle, unit.pos) && (
                  <span className="hwt-blight-power-badge" title={`On Blight: +${BLIGHT_ATTACK_BONUS} damage and mends each enemy turn`}>
                    +{BLIGHT_ATTACK_BONUS}
                  </span>
                )}
                {intent && (intent.kind === "attack" || intent.kind === "move-attack") && (
                  <span className="hwt-intent-badge" data-intent="attack" data-fade={!!intent.fade || undefined} title={`Will strike ${getUnitName(battle, intent.targetId)}${intent.fade ? ", then fade up to 2 tiles back" : ""}`}>
                    <CardGlyph name="sword" className="hwt-intent-icon" />
                    {intent.fade && <span className="hwt-fade-mark">↩</span>}
                  </span>
                )}
                {intent && intent.kind === "wall" && (
                  <span className="hwt-intent-badge" data-intent="object" title={intent.object ? `Will set off the ${OBJECTS[intent.object]?.name.toLowerCase() || "object"} next to your heroes` : "Will smash what blocks its way"}>
                    {intent.object ? "💥" : "⚒"}
                  </span>
                )}
                {intent && intent.kind === "move" && (
                  <span className="hwt-intent-badge" data-intent="move" title="Advancing">
                    ➤
                  </span>
                )}
                {intent && intent.kind === "overwatch" && (
                  <span className="hwt-intent-badge" data-intent="overwatch" title="Will go on Overwatch - it shoots the first of your heroes that ends a move in its reach">
                    👁
                  </span>
                )}
                {intent && intent.kind === "aoe" && (
                  <span className="hwt-intent-badge" data-intent="aoe" title="Will strike every hero at once">
                    ✺
                  </span>
                )}
                {intent && intent.kind === "skill" && (
                  <span
                    className="hwt-intent-badge"
                    data-intent="skill"
                    data-skill-kind={intent.skillKind}
                    data-fade={!!intent.fade || undefined}
                    title={`${describeSkillIntent(intent, (id) => getUnitName(battle, id))}${intent.fade ? ", then fade up to 2 tiles back" : ""}`}
                  >
                    {intent.icon}
                    {intent.fade && <span className="hwt-fade-mark">↩</span>}
                  </span>
                )}
                {intent && intent.kind === "stunned" && (
                  <span className="hwt-intent-badge" data-intent="stunned" data-frozen={!!intent.frozen} title={intent.frozen ? "Frozen - will skip its next turn (hit it now for a +50% Shatter, but that thaws it)" : "Stunned - will skip its next turn"}>
                    {intent.frozen ? "🧊" : "✦"}
                  </span>
                )}
              </div>
              <span className="hwt-token-name">{unit.name}</span>
              <div className="hwt-hp-track">
                <div className="hwt-hp-fill" style={{ width: `${Math.max(0, Math.round((unit.hp / unit.maxHp) * 100))}%` }} />
              </div>
              <ManaBar unit={unit} battle={battle} />
              <MeleeBadges unit={unit} battle={battle} />
              <span
                className="hwt-atk-gem"
                data-buffed={unit.attack > unit.baseAttack}
                data-weak={unit.weak > 0}
                title={`Attack ${unit.attack}`}
              >
                {unit.attack}
              </span>
              <span className="hwt-hp-gem" data-hurt={unit.hp < unit.maxHp} title={`${unit.hp}/${unit.maxHp} HP`}>
                {unit.hp}
              </span>
            </motion.div>
          )}
        </div>,
      )
    }
  }

  return (
    <>
      <div className="hwt-layout">
        <div className="hwt-board-col">
          <SquadBar battle={battle} selectedId={selectedId} onSelect={handleSquadSelect} />
          <div
            className="hwt-board"
            style={{ gridTemplateColumns: `repeat(${battle.grid.cols}, 76px)`, gridTemplateRows: `repeat(${battle.grid.rows}, 76px)`, "--hwt-blight-art": BLIGHT_ART_URL }}
          >
            {cells}
            <BoardOverlay battle={battle} pairs={aggro} hoverPath={hoverPath} selected={selected} healReachTiles={healRing.size ? healReach(selected) : 0} />
          </div>
        </div>

        <div className="hwt-panel">
          {bossInfo && <BossBar info={bossInfo} />}
          <div className="hwt-turn-header" data-phase={battle.phase}>
            <div className="hwt-turn-label" data-phase={battle.phase}>
              {deploying && "Deployment"}
              {battle.phase === "player" && `Player Turn ${battle.turn}`}
              {battle.phase === "enemy" && "Enemy Turn"}
              {battle.phase === "won" && "Victory"}
              {battle.phase === "lost" && "Defeat"}
            </div>
            <div className="hwt-turn-sub">
              {deploying && "Place your heroes - enemies act after your first turn"}
              {battle.phase === "player" && "Your move"}
              {battle.phase === "enemy" && "The enemy acts..."}
              {(battle.phase === "won" || battle.phase === "lost") && "The battle is over"}
            </div>
          </div>
          {factionView && (
            <div className="hwt-faction-banner" data-faction={factionView.id}>
              <div className="hwt-faction-title">
                <span className="hwt-faction-icon">{factionView.icon}</span> {factionView.tag}
              </div>
              <div className="hwt-faction-hint">{factionView.hint}</div>
              {factionView.id === "corrupted" && (
                <div className="hwt-faction-extra">
                  <BlightIcon />
                  Blight: {factionView.blightCount} tile(s){blightNext.size ? ` - spreads to ${blightNext.size} more next enemy turn (dashed)` : ""}
                </div>
              )}
            </div>
          )}
          <div className="hwt-objective" data-objective={objective.type}>
            <div className="hwt-objective-title">Objective: {objective.title}</div>
            <div className="hwt-objective-detail">{objective.detail}</div>
            {objective.extra && <div className="hwt-objective-extra">{objective.extra}</div>}
          </div>
          {terrainKinds.length > 0 && (
            <div className="hwt-terrain-legend">
              <span className="hwt-terrain-legend-title">Battlefield</span>
              {terrainKinds.map((t) => (
                <span key={t} className="hwt-terrain-legend-item" data-kind={t} title={TERRAIN_INFO[t].text}>
                  <TerrainIcon type={t} />
                  {TERRAIN_INFO[t].name}
                </span>
              ))}
            </div>
          )}
          {selected && selected.side === "player" && (
            <div className="hwt-selected-card" data-role={roleOf(selected)}>
              <TokenArt unit={selected} />
              <div className="hwt-selected-info">
                <span className="hwt-selected-name">{selected.name}</span>
                <span className="hwt-selected-role" data-role={roleOf(selected)}>
                  <span className="hwt-selected-role-icon">{BATTLE_ROLES[roleOf(selected)].icon}</span>
                  <strong>{BATTLE_ROLES[roleOf(selected)].label}</strong>
                  <span className="hwt-selected-role-what">{BATTLE_ROLES[roleOf(selected)].what}</span>
                </span>
                {classInfoFor(selected) && (
                  <span className="hwt-class-badge" data-class-id={selected.classId} title={`${classInfoFor(selected).passive.name}: ${classInfoFor(selected).passive.text}`}>
                    <span className="hwt-class-icon">{classInfoFor(selected).icon}</span> {classInfoFor(selected).name}
                    {archetypeOf(selected) && <span className="hwt-class-archetype"> · {archetypeOf(selected).name}</span>}
                  </span>
                )}
                <span className="hwt-selected-stats">
                  <span data-stat="atk" title="Attack">⚔ {selected.attack}</span>
                  <span data-stat="hp" title="Health">♥ {selected.hp}/{selected.maxHp}</span>
                  <span data-stat="move" title="Movement">➤ {selected.move}</span>
                  <span data-stat="range" title={rangeAt(battle, selected) > selected.range ? "Attack range (+1 from high ground)" : "Attack range"}>
                    ◎ {rangeAt(battle, selected)}
                  </span>
                  {hasMana(selected) && (
                    <span data-stat="mana" data-res={profileOf(selected).id} title={`${manaSummary(selected, battle)}. ${profileOf(selected).text}${selected.overcharge > 0 ? ` Overcharge: the next skill gets +${surgeFor(selected)}.` : ""}`}>
                      {profileOf(selected).icon} {selected.mana}/{selected.manaMax}
                      {selected.overcharge > 0 && <b className="hwt-stat-over"> +{selected.overcharge}</b>}
                    </span>
                  )}
                </span>
                {hasMana(selected) && <ResourceInfo unit={selected} battle={battle} />}
              </div>
            </div>
          )}
          {hitPreview && hitPreview.rolls && (
            <div className="hwt-hit-panel" data-hit={hitPreview.chance}>
              <div className="hwt-hit-panel-head">
                <b>{hitPreview.chance}%</b> to hit {hitPreview.targetName}
                {!hitPreview.skill && (
                  <span>
                    {" "}
                    · {hitPreview.full} dmg, graze {hitPreview.graze}
                  </span>
                )}
              </div>
              <div className="hwt-hit-panel-parts">
                {hitPreview.parts.map((p, i) => (
                  <span key={p.label} data-sign={i === 0 ? "base" : p.value >= 0 ? "plus" : "minus"}>
                    {p.label} {i === 0 ? p.value : p.value ? `${p.value > 0 ? "+" : ""}${p.value}` : ""}
                  </span>
                ))}
                {hitPreview.flanked && <span data-sign="plus">Flanked - its cover faces the wrong way</span>}
              </div>
              <div className="hwt-hit-panel-foot">A miss is a GRAZE: half damage, no extra effects.</div>
            </div>
          )}
          {selected && selected.side === "player" && battle.phase === "player" && (
            <div className="hwt-universal-actions">
              <button
                type="button"
                className="hwt-universal-btn"
                data-action="overwatch"
                data-active={selected.overwatch > 0 || undefined}
                disabled={selected.ap < 1 || !(selected.attack > 0) || isEngaged(battle, selected)}
                data-engaged={isEngaged(battle, selected) || undefined}
                onClick={() => handleUniversal("overwatch")}
                title={`${isEngaged(battle, selected) ? "ENGAGED - an enemy fighter is right next to this hero: no Overwatch or Aim until it gets clear. " : ""}Overwatch (ends this hero's turn): shoot the first enemy that ends a move within ${selected.range > 1 ? `${rangeAt(battle, selected)} tiles` : "reach (adjacent tiles)"}, with its normal attack.`}
              >
                <span className="hwt-universal-icon">👁</span> Overwatch
              </button>
              <button
                type="button"
                className="hwt-universal-btn"
                data-action="hunker"
                data-active={selected.hunkered > 0 || undefined}
                disabled={selected.ap < 1}
                onClick={() => handleUniversal("hunker")}
                title={rolling ? "Hunker Down (ends this hero's turn): your cover counts one step better until your next turn - none becomes half, half becomes full, full becomes hunkered full (-55% to be hit)." : "Hunker Down (ends this hero's turn): take 50% less damage until your next turn."}
              >
                <span className="hwt-universal-icon">🛡</span> Hunker Down
              </button>
              {(selected.rangedKit || []).map((sk) => (
                <button
                  key={sk.id}
                  type="button"
                  className="hwt-universal-btn"
                  data-action={`ranged-${sk.id}`}
                  data-active={armedSkillId === sk.id || (sk.id === "aim" && selected.aimed > 0) || undefined}
                  data-no-mana={!!manaBlockReason(selected, sk) || undefined}
                  disabled={!classSkillUsable(battle, selected, sk) || (sk.id === "aim" && selected.aimed > 0)}
                  onClick={() => handleSkillClick(sk)}
                  title={`${sk.name} (${sk.cost} AP${hasMana(selected) ? `, ${skillCostText(selected, sk)}` : ""}, recharge ${sk.cooldown}) - ${sk.text}${manaBlockReason(selected, sk) ? `\nNot enough ${resourceLabel(selected)}: ${manaBlockReason(selected, sk)}.` : ""}${sk.id === "aim" && isEngaged(battle, selected) ? "\nENGAGED - an enemy fighter is next to it: no Aim." : ""} Every ranged hero has this.`}
                >
                  <span className="hwt-universal-icon">{sk.icon}</span> {sk.name}
                  <small className="hwt-universal-cost">{classSkillStatus(selected, sk)}{hasMana(selected) ? ` · ${skillCostText(selected, sk)}` : ""}</small>
                </button>
              ))}
              {potionOf(selected) && (
                <button
                  type="button"
                  className="hwt-universal-btn"
                  data-action="potion"
                  disabled={selected.ap < POTION_AP}
                  onClick={handlePotion}
                  title={`${potionOf(selected).name} (${POTION_AP} AP): restore ${scaleAmount(selected, potionOf(selected).mana.restore)} ${resourceLabel(selected)} - extra spills into Overcharge. Used up once drunk.`}
                >
                  <span className="hwt-universal-icon">⚗</span> Drink +{scaleAmount(selected, potionOf(selected).mana.restore)} {resourceLabel(selected)}
                </button>
              )}
              {hasMana(selected) && profileOf(selected).special === "sacrifice" && (
                <button
                  type="button"
                  className="hwt-universal-btn"
                  data-action="sacrifice"
                  disabled={!canSacrifice(battle, selected.id)}
                  onClick={() => onBattleChange(sacrifice(battle, selected.id))}
                  title={`Sacrifice (free, once a turn): pay ${sacrificeCost(selected)} HP for +${profileOf(selected).sacrificeGain} Blood.`}
                >
                  <span className="hwt-universal-icon">🩸</span> Sacrifice
                  <small className="hwt-universal-cost">-{sacrificeCost(selected)} HP · +{profileOf(selected).sacrificeGain} Blood</small>
                </button>
              )}
            </div>
          )}
          {deploying && (
            <button className="hwt-begin-battle" onClick={handleBegin}>
              Begin Battle
            </button>
          )}
          {!deploying && (
          <button
            className="hwt-end-turn"
            onClick={handleEndTurn}
            disabled={battle.phase !== "player"}
            data-ready={battle.phase === "player" && !battle.units.some((u) => u.side === "player" && u.hp > 0 && u.ap > 0)}
          >
            End Turn
          </button>
          )}
          {battle.activePower && (() => {
            const power = battle.activePower
            const commander = battle.units.find((u) => u.id === "player-commander")
            // Mana step 1: with mana on, the Power is the Commander's mana ULTIMATE.
            const ultimate = hasMana(commander)
            const full = ultimate && ultimateReady(commander)
            const ready = (ultimate ? full : !power.used) && battle.phase === "player" && commander && commander.hp > 0 && commander.ap >= 1
            const status = !commander || commander.hp <= 0
              ? "Your Commander has fallen"
              : ultimate
                ? full
                  ? commander.ap < 1
                    ? "Your Commander needs 1 AP"
                    : `Ultimate ready · spends all ${commander.manaMax} ${resourceLabel(commander)} + 1 AP`
                  : `Ultimate · needs a full ${profileOf(commander).name} bar (${commander.mana}/${commander.manaMax})${power.timesFired ? ` · used ${power.timesFired}x` : ""}`
                : power.used
                  ? "Used this battle"
                  : commander.ap < 1
                    ? "Your Commander needs 1 AP"
                    : "Once per battle · 1 Commander AP"
            return (
              <div className="hwt-power-panel" data-used={ultimate ? !full : power.used} data-ultimate={ultimate || undefined}>
                <button className="hwt-power-btn" disabled={!ready} onClick={handleActivePower} title={ultimate ? `${power.description} Mana ultimate: needs a full bar and spends all of it; refill to use again.` : power.description}>
                  <span className="hwt-power-crown">♛</span> {power.name}
                </button>
                {ultimate && commander && <ManaBar unit={commander} battle={battle} className="hwt-power-mana" />}
                <p className="hwt-power-desc">{power.description}</p>
                <p className="hwt-power-status">{status}</p>
              </div>
            )
          })()}
          {selected && selected.side === "player" && classInfoFor(selected) && battle.phase === "player" && (
            <div className="hwt-skill-bar" data-count={(selected.ability ? 1 : 0) + (selected.classSkills || []).length}>
              <div className="hwt-skill-bar-head">
                <span className="hwt-skill-bar-class">
                  {classInfoFor(selected).icon} {classInfoFor(selected).name}
                </span>
                {archetypeOf(selected) && (
                  <span className="hwt-archetype" data-archetype={archetypeOf(selected).id} title={`${archetypeOf(selected).name}: ${archetypeOf(selected).what}`}>
                    {archetypeOf(selected).icon} {archetypeOf(selected).name}
                  </span>
                )}
                <span className="hwt-skill-bar-passive" title={classInfoFor(selected).passive.text}>
                  Passive: {classInfoFor(selected).passive.name}
                </span>
              </div>
              <div className="hwt-skill-row">
                {(selected.classSkills || []).map((sk, i) => {
                  const ready = classSkillUsable(battle, selected, sk)
                  const key = (selected.ability ? 2 : 1) + i
                  return (
                    <button
                      key={sk.id}
                      className="hwt-skill-btn"
                      data-skill-id={sk.id}
                      data-active={armedSkillId === sk.id}
                      data-upgraded={sk.upgrade ? sk.upgrade.branch : undefined}
                      data-no-mana={!!manaBlockReason(selected, sk) || undefined}
                      disabled={!ready}
                      onClick={() => handleSkillClick(sk)}
                      title={`${sk.name} (${sk.cost} AP${hasMana(selected) ? `, ${skillCostText(selected, sk)}` : ""}, recharge ${sk.cooldown}) - ${sk.text}${manaBlockReason(selected, sk) ? `\nNot enough ${resourceLabel(selected)}: ${manaBlockReason(selected, sk)}.` : ""}${sk.upgrade ? `\n★ ${sk.upgrade.name} (${sk.upgrade.branch}): ${sk.upgrade.text}` : ""}${key <= 4 ? ` [key ${key}]` : ""}`}
                    >
                      <span className="hwt-skill-icon">{sk.icon}</span>
                      <span className="hwt-skill-name">{sk.name}</span>
                      {sk.upgrade && (
                        <span className="hwt-skill-upgrade">
                          ★ {sk.upgrade.name}
                        </span>
                      )}
                      <span className="hwt-skill-cost">{classSkillStatus(selected, sk)}</span>
                      {hasMana(selected) && (
                        <span className="hwt-skill-mana" data-res={profileOf(selected).id} data-mode={sk.spend || undefined} data-short={!!manaBlockReason(selected, sk) || undefined} title={skillCostText(selected, sk)}>
                          {skillCostText(selected, sk)}
                        </span>
                      )}
                      {hitPreview && hitPreview.rolls && sk.target === "enemy" && (
                        <span className="hwt-skill-hit" title={`Chance to hit ${hitPreview.targetName} (a miss grazes for half)`}>
                          {hitPreview.chance}%
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              {armedSkill && <p className="hwt-skill-hint">{armedSkill.target === "ally" ? `Choose an ally for ${armedSkill.name}.` : armedSkill.target === "tile" ? `Choose a tile for ${armedSkill.name}.` : `Choose an enemy for ${armedSkill.name}.`} {armedSkill.text}</p>}
              {!armedSkill && <p className="hwt-skill-passive-text">{classInfoFor(selected).passive.text}</p>}
            </div>
          )}
          {selected && selected.side === "player" && selected.ability && battle.phase === "player" && (
            <div className="hwt-ability-panel">
              <button
                className="hwt-ability-btn"
                data-upgraded={selected.ability.upgrade ? selected.ability.upgrade.branch : undefined}
                data-active={abilityMode === "heal" || abilityMode === "burst"}
                data-no-mana={!!manaBlockReason(selected, selected.ability) || undefined}
                disabled={selected.ap < selected.ability.cost || selected.cooldownRemaining > 0 || !canAfford(selected, selected.ability)}
                onClick={handleAbilityClick}
                title={`${describeAbility(selected.ability)}${hasMana(selected) ? ` Costs ${selected.ability.cost} AP + ${skillCostText(selected, selected.ability)}.` : ""}${manaBlockReason(selected, selected.ability) ? ` Not enough ${resourceLabel(selected)}: ${manaBlockReason(selected, selected.ability)}.` : ""}`}
              >
                {selected.ability.upgrade ? "★ " : ""}
                {selected.cooldownRemaining > 0
                  ? `${selected.ability.name} · Recharging (${selected.cooldownRemaining})`
                  : manaBlockReason(selected, selected.ability)
                    ? `${selected.ability.name} · ${manaBlockReason(selected, selected.ability).replace(/ \(has \d+\)$/, "")}`
                    : `${selected.ability.name} · ${selected.ability.cost} AP${hasMana(selected) ? ` · ${skillCostText(selected, selected.ability)}` : ""}`}
                {selected.ability.upgrade && <span className="hwt-skill-upgrade"> {selected.ability.upgrade.name}</span>}
                {hitPreview && hitPreview.rolls && abilityTargetSide(selected.ability) === "enemy" && <span className="hwt-skill-hit"> {hitPreview.chance}%</span>}
              </button>
              <p className="hwt-ability-hint">{abilityMode === "heal" || abilityMode === "burst" ? abilityHint(selected.ability) : describeAbility(selected.ability)}</p>
              {describeAbilityElement(selected) && <p className="hwt-ability-element">{describeAbilityElement(selected)}</p>}
            </div>
          )}
          <ElementHelp />
          <div className="hwt-log-heading">Battle log</div>
          <div className="hwt-log">
            {[...battle.log].reverse().map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {children}
        </div>
      </div>

      <TacticsFx battle={battle} />

      {(battle.phase === "won" || battle.phase === "lost") && (
        <div className="hwt-result">
          <div className="hwt-result-title" data-outcome={battle.phase}>
            {battle.phase === "won" ? "Victory" : "Defeat"}
          </div>
          <div className="hwt-result-actions">{resultActions}</div>
        </div>
      )}
    </>
  )
}
