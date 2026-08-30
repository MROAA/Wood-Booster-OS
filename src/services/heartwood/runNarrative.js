// Heartwood - node narrative resolver.
//
// PURPOSE
// One pure function that turns a RUN_PATH node (runEngine.js) into the
// display shape every "what is this stop" surface needs - the formation
// screen's flavor line today, the run map / hover cards next. It reads
// only data modules; it holds no run state and mutates nothing, so it
// is safe to call once per node per render (~110x) without a perf or
// ordering concern.
//
// RESPONSIBILITIES
// - Derive a never-null `title` and a `kind` ("stop" | "fight") from the
//   node's own `type`.
// - Resolve the authored narrative fields (`beat`, `intro`) through a
//   fallback chain so a node with NOTHING authored still returns valid,
//   non-empty data - the game shipped fine before any of these fields
//   existed and must keep doing so.
// - Attach the difficulty/story tier for this position
//   (difficultyTierForNode) so callers never recompute it.
// - Expose `art` / `color` matching RunMap.jsx's own nodeGlyph/nodeColor
//   verbatim, so that component can later swap its inline logic for this
//   resolver with zero visual change.
//
// DEPENDENCIES (one-directional, no cycle)
//   runNarrative.js -> runEngine.js (difficultyTierForNode)
//                   -> data/heartwood/{trials,enemies,formations}
// runEngine.js must NOT import this module. Components import
// runNarrative; the engine stays unaware of it.
//
// PUBLIC API
//   nodeNarrative(node, index, pathLength) -> {
//     type, kind, id, title, beat, intro, art, color, tier, isTrial,
//     trial, choice
//   }
// The shape is deliberately open: `choice` is a null-today forward slot
// for a future story node that carries a build/deck option or a
// progression-rule twist, and a new node `type` resolves through this
// same function rather than a parallel one.
//
// EXAMPLE
//   import { RUN_PATH } from "./runEngine"
//   import { nodeNarrative } from "./runNarrative"
//   const n = nodeNarrative(RUN_PATH[10], 10, RUN_PATH.length)
//   // n.title === "Rootkeeper", n.kind === "fight", n.isTrial === true,
//   // n.tier.name === "Act I - Roots"
//
// TESTS
//   Verified in-browser in feat/hearthwood-7-act-structure: every
//   RUN_PATH node resolves a non-null title and never throws; see the
//   PR description for the walk-the-path check.

import { resolveTrial } from "../../data/heartwood/trials"
import { ENEMIES } from "../../data/heartwood/enemies"
import { resolveFormation } from "../../data/heartwood/formations"
import { difficultyTierForNode } from "./runEngine"

// A stop is a node you interact with but do not fight through (market,
// relic); a fight is any battle-type node. Anything unknown is treated
// as a stop - the safe default (no combat UI spun up for it). A future
// story-driven node type (a build/deck choice, a progression-rule twist,
// a "something good happens" reward - Marc's "deck-building options and
// new perspectives on progression") registers here as a "stop" and
// resolves through this same function; see the `choice` slot below.
const KIND_BY_TYPE = {
  shop: "stop",
  relic: "stop",
  battle: "fight",
  miniboss: "fight",
  boss: "fight",
}

const TYPE_LABELS = {
  shop: "Market",
  relic: "Relic",
  battle: "Battle",
  miniboss: "Greater Foe",
  boss: "Final Stand",
}

function humanizeType(type) {
  if (!type) return "Waypoint"
  return TYPE_LABELS[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

// art/color are lifted verbatim from RunMap.jsx's nodeGlyph/nodeColor
// (that file is another session's scope - do not edit it here). Keep
// these two helpers behaviourally identical to its copies until it
// adopts this resolver.
function nodeArt(node) {
  if (node.type === "shop") return "spark"
  if (node.type === "relic") return "rune"
  if (node.type === "boss") return "spacemonkeyBoss"
  if (node.formationId) return "warden"
  return ENEMIES[node.enemyId]?.art || "warden"
}

function nodeColor(node) {
  if (node.type === "boss") return "var(--hw-hp)"
  if (node.type === "miniboss") return "var(--hw-curse)"
  if (node.type === "shop" || node.type === "relic") return "var(--hw-moss)"
  return "var(--hw-ember)"
}

/**
 * Resolve a RUN_PATH node into its display/narrative shape.
 *
 * @param {object} node        a RUN_PATH entry ({ type, enemyId?, formationId?, trialId?, beat?, ... })
 * @param {number} [index]     the node's position in the run (nodeIndex)
 * @param {number} [pathLength] the run's fixed length (RUN_PATH.length) - the tier denominator
 * @returns {{
 *   type: (string|null), kind: ("stop"|"fight"), id: string,
 *   title: string, beat: (string|null), intro: (string|null),
 *   art: string, color: string, tier: (object|null),
 *   isTrial: boolean, trial: (object|null), choice: (object|null)
 * }}
 */
export function nodeNarrative(node, index, pathLength) {
  const safeNode = node || {}
  const type = safeNode.type || null
  const kind = KIND_BY_TYPE[type] || "stop"

  const trial = resolveTrial(safeNode.trialId)
  const enemy = safeNode.enemyId ? ENEMIES[safeNode.enemyId] || null : null
  const encounterId = safeNode.formationId || safeNode.enemyId
  // resolveFormation is null-safe for a bare enemy id (synthesizes a
  // 1-piece formation with name/description null), so this is defined
  // for every battle-type node and null only for shop/relic.
  const formation = encounterId ? resolveFormation(encounterId) : null

  // title: never null. node override -> Trial identity -> formation name
  // -> single enemy name -> a humanized node type.
  const title =
    safeNode.title ||
    trial?.title ||
    formation?.name ||
    enemy?.name ||
    humanizeType(type)

  // beat: one short line for the map / hover / pre-battle blurb. An
  // authored node.beat wins; then the Trial's beat; then the encounter's
  // own description; else null (callers render nothing).
  const beat =
    safeNode.beat ||
    trial?.beat ||
    formation?.description ||
    enemy?.description ||
    null

  // intro: the longer pre-battle line. Trials own this; a plain enemy
  // may carry its own introLine; otherwise null.
  const intro = trial?.introLine || safeNode.introLine || enemy?.introLine || null

  const tier =
    Number.isFinite(index) && Number.isFinite(pathLength)
      ? difficultyTierForNode(index, pathLength)
      : null

  return {
    type,
    kind,
    id: safeNode.trialId || safeNode.formationId || safeNode.enemyId || type || "node",
    title,
    beat,
    intro,
    art: nodeArt(safeNode),
    color: nodeColor(safeNode),
    tier,
    isTrial: Boolean(trial),
    trial: trial || null,
    // Forward slot, intentionally null for every node type that exists
    // today. When a later pass adds a story node that offers a choice -
    // a deck/build option, an alternate progression rule, a boon/reward -
    // it hangs its payload on `node.choice` and this resolver surfaces it
    // here, so consumers can branch on `narrative.choice` without a new
    // resolver. Kept as a plain object (not frozen) so that pass can add
    // sibling fields (`reward`, `boon`, ...) the same way.
    choice: safeNode.choice || null,
  }
}
