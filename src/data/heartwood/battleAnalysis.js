// Hearthwood Trial - battle outcome analysis. The three latest
// north-star PRDs ("Challenging, Fair & Strategically Deep" 10 / 19 /
// 40, "Strategic Combat System V2" 52) all press one point: after a
// fight the player must be able to name WHAT settled it, WHY, and a
// couple of things they could TRY - with options shown, never one
// "correct" answer.
//
// ResultOverlay already shows summarizeBattle()'s readability recap (who
// dealt what, biggest hit, closest call). This is the layer above it: a
// classified verdict + contributing factors + non-prescriptive
// suggestions, read from the battle END-STATE plus evaluateBuild /
// unitProfile. A PURE function - reads state + runState, writes nothing,
// no engine touch, no RUN_SAVE_VERSION bump. Placeholder-first: the
// priority order and phrasing below are one edit to retune.

import { UNITS } from "./units"
import { unitProfile, positionFitForSlot } from "./roles"
import { effectiveRole } from "./items"
import { evaluateBuild, SCORE_DIMS } from "./buildScore"

// Mirrors autoBattleEngine's MAX_ROUNDS - a fight that reached the cap
// was decided by exhaustion, i.e. it stalled out.
const MAX_ROUNDS = 30

export const VERDICTS = [
  "won-clean",
  "won-solid",
  "won-narrow",
  "lost-stalled",
  "lost-sustain",
  "lost-backline",
  "lost-frontline",
  "lost-nosynergy",
  "lost-outmatched",
]

const FINISHERS = ["execute", "aoe", "chain"]
const cap3 = (arr) => arr.filter(Boolean).slice(0, 3)
const dimLabel = (id) => SCORE_DIMS.find((d) => d.id === id)?.label || id

// Everything the classifier needs about the ended fight, derived once.
function buildContext(state, runState, opts) {
  const won = state.phase === "won"
  const roundCount = state.round || 1
  const lowestPct = Math.round(state.lowestSquadHpPct ?? 100)
  const stalled = roundCount >= MAX_ROUNDS

  const recruited = (state.playerUnits || [])
    .filter((u) => u.id !== "commander" && u.defId && UNITS[u.defId])
    .map((u) => {
      const def = UNITS[u.defId]
      const itemIds = u.itemIds || []
      const bent = effectiveRole(def.role, itemIds)
      const profile = unitProfile(def, bent && bent !== def.role ? bent : undefined)
      const slotIndex = Number(String(u.id).slice(1))
      return {
        def,
        profile,
        slotIndex: Number.isFinite(slotIndex) ? slotIndex : null,
        row: u.pos?.row ?? 2,
        dead: (u.hp ?? 0) <= 0,
      }
    })

  const deadUnits = recruited.filter((u) => u.dead)
  const healers = recruited.filter((u) => u.profile?.primary === "healer")
  const hasTank = recruited.some((u) => u.profile?.primary === "tank" || u.profile?.secondary === "tank")
  const frontUnit = recruited.find((u) => u.row <= 1)

  const enemyMaxHp = (state.enemies || []).reduce((s, e) => s + (e.maxHp || 0), 0)
  const enemyHp = (state.enemies || []).reduce((s, e) => s + Math.max(0, e.hp || 0), 0)

  return {
    won,
    roundCount,
    lowestPct,
    stalled,
    recruited,
    deadUnits,
    healers,
    hasTank,
    frontUnit,
    frontAlive: recruited.some((u) => u.row <= 1 && !u.dead),
    deadBack: deadUnits.filter((u) => u.row === 2).length,
    squadCount: recruited.length,
    enemyCount: (state.enemies || []).length,
    enemyHpFrac: enemyMaxHp > 0 ? enemyHp / enemyMaxHp : 0,
    squadHasFinisher: recruited.some((u) => (u.profile?.tags || []).some((t) => FINISHERS.includes(t))),
    build: runState ? evaluateBuild(runState) : null,
    nodeType: opts?.nodeType || null,
  }
}

// Weakest 1-2 scored axes, phrased - the generic "the enemy had more"
// fallback and won-solid both lean on this.
function weakAxes(build) {
  if (!build?.scores) return []
  return SCORE_DIMS.map((d) => [d.id, build.scores[d.id] ?? 0])
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([id, v]) => `${dimLabel(id)} is thin (${v}/10)`)
}

// evaluateBuild's first note is its biggest gap - unless it's one of the
// two "nothing wrong / nothing deployed" fillers.
const FILLER_NOTES = ["A rounded squad", "Place units"]
function realNote(build) {
  const n = build?.notes?.[0]
  return n && !FILLER_NOTES.some((f) => n.startsWith(f)) ? n : null
}

// The loss branch - also reused (softened) for a narrow win. First
// match wins; every path bottoms out at "outmatched" so a verdict is
// never wrong-flavoured, only ever more or less specific.
function classifyLoss(ctx) {
  const { build } = ctx
  const nodeFactor =
    ctx.nodeType === "elite"
      ? "This was an Elite - it hits a gear when hurt"
      : ctx.nodeType === "boss" || ctx.nodeType === "miniboss"
        ? `This was a ${ctx.nodeType} - a real check on the whole build`
        : null

  // 1. Stalled - ran the clock, or a long fight left the enemy near-full.
  // A SHORT fight the enemy dominated isn't "stalled", it's overrun -
  // that falls through to the front/back/outmatched branches below.
  if (ctx.stalled || (ctx.enemyHpFrac > 0.55 && ctx.roundCount >= 8)) {
    return {
      verdict: "lost-stalled",
      headline: `The fight stalled - your squad couldn't close it${ctx.stalled ? " before time ran out" : ""}.`,
      factors: cap3([
        build && build.scores.damage <= 3 && `Low damage output (${build.scores.damage}/10)`,
        !ctx.squadHasFinisher && "No execute, AoE or chain to finish wounded enemies",
        ctx.enemyHpFrac > 0.55 && `The enemy still held ${Math.round(ctx.enemyHpFrac * 100)}% of its health`,
        `The fight ran ${ctx.roundCount} rounds`,
        nodeFactor,
      ]),
      suggestions: [
        "Add a dedicated DPS or an Execute-tag unit",
        "Take a Power upgrade branch on your main attacker",
        "A damage relic to lift the whole squad's output",
      ],
    }
  }

  // 2. Sustain collapse - a healer fell and the plan leaned on it.
  if (ctx.healers.length > 0 && ctx.healers.some((h) => h.dead) && (!build || build.scores.sustain >= 4)) {
    const exposed = ctx.healers.some(
      (h) => h.dead && h.slotIndex != null && positionFitForSlot(h.profile?.position, h.slotIndex) === "out",
    )
    return {
      verdict: "lost-sustain",
      headline: "Your healer went down and the squad couldn't stay standing.",
      factors: cap3([
        exposed && "Your healer was in an exposed slot",
        !ctx.hasTank && "No tank to hold the enemy's attention",
        ctx.healers.length === 1 && "Only one source of healing",
        nodeFactor,
      ]),
      suggestions: [
        "Move the healer to a back-row corner",
        "Add a second sustain source - regen, lifelink, an aura",
        "A tank or Protector to pull aggro off the back line",
      ],
    }
  }

  // 3. Backline picked apart while the front held.
  if (ctx.deadBack >= 2 && ctx.frontAlive) {
    const outOfPlace = build?.positioning ? build.positioning.total - build.positioning.matched : 0
    return {
      verdict: "lost-backline",
      headline: "The back line was picked apart while the front held.",
      factors: cap3([
        outOfPlace >= 1 && `${outOfPlace} unit${outOfPlace > 1 ? "s" : ""} out of position`,
        !ctx.hasTank && "No real front line to screen the back row",
        "The back row folded fast",
        nodeFactor,
      ]),
      suggestions: [
        "A tank in the forward slot to screen the back row",
        "Move your carry to a true back corner",
        "An armour or block item on a fragile back-liner",
      ],
    }
  }

  // 4. Front collapsed in the opening rounds.
  if ((ctx.recruited.some((u) => u.profile?.primary === "tank" && u.dead) || ctx.frontUnit?.dead) && ctx.roundCount <= 5) {
    return {
      verdict: "lost-frontline",
      headline: "The front collapsed early and the squad was overrun.",
      factors: cap3([
        "Not enough front-line HP to survive the opening",
        ctx.enemyCount > ctx.squadCount && `Outnumbered ${ctx.enemyCount} to ${ctx.squadCount}`,
        ctx.roundCount <= 3 && `It was over in ${ctx.roundCount} rounds`,
        nodeFactor,
      ]),
      suggestions: [
        "A second bruiser or off-tank up front",
        "A Defense upgrade branch on your tank",
        "A block or ward relic for the whole squad",
      ],
    }
  }

  // 5. No shared identity - units never combined.
  if (build && build.scores.synergy === 0 && build.deployedCount >= 3) {
    return {
      verdict: "lost-nosynergy",
      headline: "Your units never clicked - no shared tribe, no combo.",
      factors: cap3([
        "The squad spreads across too many tribes",
        build.core && `${build.core.name} had no tribe-mates`,
        nodeFactor,
      ]),
      suggestions: [
        "Lean one tribe to its first synergy threshold",
        "A Synergy upgrade branch to count a unit twice",
        "Swap the odd unit out for one that shares a tribe",
      ],
    }
  }

  // 6. Fallback - the enemy was simply ahead.
  return {
    verdict: "lost-outmatched",
    headline: "The enemy build simply had more this fight.",
    factors: cap3([...(build ? weakAxes(build) : ["The enemy was ahead on several fronts"]), realNote(build), nodeFactor]),
    suggestions: [
      "Shore up your weakest axis before the next fight",
      "Save Essence for a Rare next shop instead of two commons",
      "A relic that doubles down on your plan",
    ],
  }
}

// { verdict, headline, factors: string[], suggestions: string[] }.
// opts.nodeType (elite / miniboss / boss) is optional flavour.
export function analyzeOutcome(state, runState, opts) {
  if (!state || (state.phase !== "won" && state.phase !== "lost")) return null
  const ctx = buildContext(state, runState, opts)

  if (!ctx.won) return classifyLoss(ctx)

  // Clean win - never in real danger.
  if (ctx.lowestPct >= 55 && ctx.deadUnits.length === 0) {
    const why = ctx.build?.core
      ? ` ${ctx.build.core.name} carried it - ${ctx.build.core.why.toLowerCase()}.`
      : ctx.build
        ? ` Its edge: ${dimLabel(SCORE_DIMS.map((d) => [d.id, ctx.build.scores[d.id] ?? 0]).sort((a, b) => b[1] - a[1])[0][0]).toLowerCase()}.`
        : ""
    return {
      verdict: "won-clean",
      headline: `A clean win - the squad never fell below ${ctx.lowestPct}%.${why}`,
      factors: [],
      suggestions: [],
    }
  }

  // Narrow win - won, but a hair from a wipe. Borrow the loss branch's
  // read of what nearly did it.
  if (ctx.lowestPct < 25 || ctx.deadUnits.length >= 2 || ctx.stalled) {
    const loss = classifyLoss(ctx)
    return {
      verdict: "won-narrow",
      headline: `You won - but at ${ctx.lowestPct}% squad HP. This build runs close.`,
      factors: loss.factors,
      suggestions: loss.suggestions,
    }
  }

  // Solid win - held comfortably, but name a standing gap if there is one.
  return {
    verdict: "won-solid",
    headline: `A solid win - the squad held at ${ctx.lowestPct}%.`,
    factors: cap3([realNote(ctx.build)]),
    suggestions: [],
  }
}
