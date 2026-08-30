import { useEffect, useRef } from "react"
import { ENEMIES } from "../../data/heartwood/enemies"
import { FORMATIONS } from "../../data/heartwood/formations"
import { difficultyTierForNode, DIFFICULTY_TIERS, RUN_PATH } from "../../services/heartwood/runEngine"
import { CardGlyph } from "./cardArt"

// A compact, persistent strip of every node in the run (runEngine.js's
// RUN_PATH), so the run reads as a real journey the player is moving
// through rather than a sequence of disconnected screens - Marc:
// "player goes through a field or something in perception of moving...
// so the game feels progressive." Rendered once at the top level
// (HeartwoodBattle.jsx), shared across the shop/relic/formation
// phases rather than duplicated into each screen.
//
// Replaces the previous RunMap.jsx, which was fully orphaned (zero
// importers) and built against a stale CARDS/deck data model that
// predates the current shop/relic/battle RUN_PATH shape - this is a
// rewrite against the real current state, not a revival of the old
// code.
function nodeGlyph(node) {
  if (node.type === "shop") return "spark"
  if (node.type === "relic") return "rune"
  if (node.type === "boss") return "spacemonkeyBoss"
  if (node.formationId) return FORMATIONS[node.formationId] ? "warden" : "warden"
  return ENEMIES[node.enemyId]?.art || "warden"
}

function nodeColor(node) {
  if (node.type === "boss") return "var(--hw-hp)"
  if (node.type === "miniboss") return "var(--hw-curse)"
  if (node.type === "shop" || node.type === "relic") return "var(--hw-moss)"
  return "var(--hw-ember)"
}

function nodeLabel(node) {
  if (node.type === "shop") return "Market"
  if (node.type === "relic") return "Relic"
  if (node.type === "boss") return "Spacemonkey"
  if (node.formationId) return FORMATIONS[node.formationId]?.name || "Battle"
  return ENEMIES[node.enemyId]?.name || "Battle"
}

// Compact vertical variant for the 3-zone Market's right rail (~240px
// wide, tall). The default horizontal strip above renders only
// runState.path (VISITED nodes), which at the first shop is a single
// node in a 240px box that reads as empty. This variant instead lays
// out the WHOLE planned run - RUN_PATH's ~111 fixed entries grouped
// into DIFFICULTY_TIERS's 7 Acts - as stacked, labelled Act segments
// with a wrapped row of type-coded pips per Act, the current position
// (runState.nodeIndex) marked. Purely a display branch: no new data
// model, RUN_PATH/nodeIndex are read exactly as the engine already
// exposes them.
function RunRail({ runState }) {
  const nodeIndex = runState.nodeIndex
  const total = RUN_PATH.length
  const currentTier = difficultyTierForNode(nodeIndex, total)
  const currentRef = useRef(null)

  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [nodeIndex])

  // Contiguous index ranges per Act - difficultyTierForNode's thresholds
  // are monotonic in progress, so every Act owns one unbroken stretch.
  const acts = DIFFICULTY_TIERS.map((tier) => {
    const indices = []
    for (let i = 0; i < total; i++) {
      if (difficultyTierForNode(i, total) === tier) indices.push(i)
    }
    return { tier, indices }
  }).filter((a) => a.indices.length)

  return (
    <div className="hw-run-rail">
      <div className="hw-run-rail-head">
        <span className="hw-run-rail-title">Run Map</span>
        <span className="hw-run-rail-step">
          {nodeIndex + 1}<span className="hw-run-rail-step-sep">/</span>{total}
        </span>
      </div>
      {acts.map(({ tier, indices }) => {
        const isCurrentAct = tier === currentTier
        const [actNo, ...rest] = tier.name.split(" · ")
        return (
          <div
            key={tier.name}
            className="hw-run-rail-act"
            data-current={isCurrentAct || undefined}
          >
            <div className="hw-run-rail-act-label" style={{ color: tier.color }}>
              <span className="hw-run-rail-act-no">{actNo}</span>
              {rest.length > 0 && <span className="hw-run-rail-act-place">{rest.join(" · ")}</span>}
            </div>
            <div className="hw-run-rail-pips">
              {indices.map((i) => {
                const node = RUN_PATH[i]
                const state = i === nodeIndex ? "current" : i < nodeIndex ? "done" : "todo"
                const major = node.type === "miniboss" || node.type === "boss"
                return (
                  <span
                    key={i}
                    ref={i === nodeIndex ? currentRef : null}
                    className="hw-run-rail-pip"
                    data-type={node.type}
                    data-state={state}
                    data-major={major || undefined}
                    style={{ "--hw-node-accent": nodeColor(node) }}
                    title={`${nodeLabel(node)}${state === "current" ? " — you are here" : ""}`}
                  >
                    {major && <CardGlyph name={nodeGlyph(node)} className="hw-run-rail-pip-glyph" />}
                  </span>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function RunMap({ runState, mode }) {
  const trackRef = useRef(null)
  const currentRef = useRef(null)

  if (mode === "rail") return <RunRail runState={runState} />

  // Auto-scroll so the current node stays in view as the run advances -
  // the whole point of "moving through a field" breaks if the player
  // has to manually scroll to see where they are.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [runState.nodeIndex])

  // RUN_PATH.length, not runState.path.length: since the branching-path
  // work, `path` only holds nodes actually visited so far (it grows as
  // the run is played), not the whole run - RUN_PATH's own fixed shape
  // is still the right denominator for "how far into the WHOLE run".
  const tier = difficultyTierForNode(runState.nodeIndex, RUN_PATH.length)
  const currentNode = runState.path[runState.nodeIndex]

  return (
    <div className="hw-run-map" style={{ borderColor: tier.color }}>
      <div className="hw-run-map-header">
        <span className="hw-run-map-tier" style={{ color: tier.color }}>
          {tier.name}
        </span>
        {/* Marc, direct: "on epäselvää että missä kohti olen menossa
            mapissa" (it's unclear where I am on the map) - the current
            node's own glow/scale wasn't enough on its own to answer
            "where am I" at a glance, especially this early in a ~86-
            node run where "here" sits right at the strip's edge with
            nothing around it yet. A plain step count answers it
            immediately without needing to spot the right icon. */}
        <span className="hw-run-map-progress">
          Step {runState.nodeIndex + 1} of {RUN_PATH.length} · {nodeLabel(currentNode)}
        </span>
      </div>
      <div className="hw-run-track" ref={trackRef}>
        <div className="hw-run-line" />
        {runState.path.map((n, i) => {
          const isCurrent = i === runState.nodeIndex
          const isDone = i < runState.nodeIndex
          const isMajor = n.type === "miniboss" || n.type === "boss"
          // Shop/relic stops are routine, not story beats - visually
          // quieter than a battle so the eye lands on the fights (the
          // actual points of interest) instead of the market icon that
          // repeats every other node. Same "quiet vs loud" instinct the
          // status-badge work applied to combat, applied here to the
          // path itself.
          const isMinor = n.type === "shop" || n.type === "relic"
          return (
            <div
              key={i}
              ref={isCurrent ? currentRef : null}
              className="hw-run-node"
              data-current={isCurrent}
              data-done={isDone}
              data-major={isMajor}
              data-minor={isMinor}
              data-type={n.type}
              style={{ "--hw-node-accent": nodeColor(n) }}
              title={nodeLabel(n)}
            >
              {isCurrent && <div className="hw-run-node-marker" style={{ color: tier.color }} />}
              {/* Forest-path silhouette behind the glyph - a campfire for a
                  fight, a chest for the market, a rune stone for a relic
                  stop, a gate for the Spacemonkey - so the path reads as
                  trail waymarkers, not a row of generic circles (Marc,
                  PRD §23: "elävä metsäpolku, ei node-graafi"). Pure CSS
                  clip-path shapes on data-type, sized by the same
                  Fibonacci/golden-ratio rhythm as .hw-piece-glyph below -
                  no new art asset needed. */}
              <div className="hw-run-node-shape" aria-hidden="true" />
              <CardGlyph name={nodeGlyph(n)} className="hw-piece-glyph" style={{ color: nodeColor(n) }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
