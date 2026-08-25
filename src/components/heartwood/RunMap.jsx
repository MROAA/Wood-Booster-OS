import { useEffect, useRef } from "react"
import { ENEMIES } from "../../data/heartwood/enemies"
import { FORMATIONS } from "../../data/heartwood/formations"
import { difficultyTierForNode } from "../../services/heartwood/runEngine"
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

export default function RunMap({ runState }) {
  const trackRef = useRef(null)
  const currentRef = useRef(null)

  // Auto-scroll so the current node stays in view as the run advances -
  // the whole point of "moving through a field" breaks if the player
  // has to manually scroll to see where they are.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
  }, [runState.nodeIndex])

  const tier = difficultyTierForNode(runState.nodeIndex, runState.path.length)

  return (
    <div className="hw-run-map" style={{ borderColor: tier.color }}>
      <div className="hw-run-map-tier" style={{ color: tier.color }}>
        {tier.name}
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
              title={nodeLabel(n)}
            >
              <CardGlyph name={nodeGlyph(n)} className="hw-piece-glyph" style={{ color: nodeColor(n) }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
