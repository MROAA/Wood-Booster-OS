import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { CardGlyph } from "./cardArt"
import { TRIBES, tribesOf, synergyTiersSummary } from "../../data/heartwood/synergies"

const ICON_BY_MOVE = { attack: "sword", block: "shield", heal: "heart" }
const ROLE_ACCENT = { dps: "attack", tank: "power", support: "skill", hybrid: "skill" }

// Physical-card hover (Marc's PRD sect. 9/18-20/31, "sen pitää viettää
// minut visuaalisuudellaan" - it needs to captivate with its visuals; a
// card should feel like an object, not flat web UI). Kept deliberately
// restrained (a few degrees, not a full holographic-trading-card tilt)
// per this repo's own "hillitty minimalistinen" anchor - a small lift
// and a subtle cursor-following tilt read as "physical" without
// tipping into gimmicky VFX.
const HOVER_LIFT_PX = 8 // --space-1 (designTokens.css) - reused, not a new arbitrary value
const HOVER_SCALE = 1.035
const MAX_TILT_DEG = 6

// The same icon+number-then-a-line reading pattern proven readable for
// cards this session, reused for units - a unit's movePattern already
// carries the same sword/shield/heart vocabulary a card's effects did.
// `def.image`, when present, renders as a full portrait instead of the
// small SVG glyph medallion - bigger, more atmospheric card, same info
// underneath. Falls back to the glyph for every unit without one yet.
//
// `role` (optional): overrides def.role for the card-accent color/
// label only - Hero Bending (items.js's bendsRoleTo/effectiveRole)
// passes the unit's CURRENT effective role here so an equipped Bending
// item visibly changes the card, not just its stats. `bent` (optional):
// true when `role` differs from def.role, rendering a small "Bent"
// marker so the change reads as a build decision, not a silent stat
// bump - same "every mechanic needs a visible component" rule every
// other status/keyword in this game already follows.
//
// `tribeMatch` (optional): true when this card's own tribe(s) overlap
// with tribes the player already has elsewhere on their bench - a
// Battlegrounds/TFT "this fits your board" scouting cue (SquadDraft.jsx
// computes it from runEngine.js's benchTribeCounts), rendered as a
// moss-tinted ring, same "moss = a good thing" color language the
// synergy-met badge already uses.
//
// `frozen` (optional): true for every shop offer while runState.frozen
// is set (SquadDraft.jsx) - Hearthstone Battlegrounds' own "frost over
// the whole tavern" convention when you Freeze, missing until now
// (only the Freeze button itself changed color, the actual cards being
// locked in showed nothing).
export default function UnitCard({ def, selected, disabled, onClick, role, bent, tribeMatch, frozen }) {
  const moves = def.movePattern.filter((m) => ICON_BY_MOVE[m.type])
  const effectiveRole = role || def.role
  // Tribes (synergies.js): purely a recruit-shop/bench-planning cue, up
  // to 2 icons - a unit's own dominant mechanical identity, same
  // sword/shield/leaf/root/moonGlyph/flame vocabulary already used
  // everywhere else, zero new art.
  const tribeIds = def.role ? tribesOf(def.id, def) : []

  // Cursor-tracked tilt: raw pointer position (0-1 across the card)
  // drives rotateX/rotateY through a spring so it settles smoothly
  // instead of snapping frame-to-frame with the mouse. This has to go
  // through framer-motion's own motion values (not a hand-written
  // `style.transform` string) because this element already has an
  // `animate` prop below controlling its mount transform - framer-
  // motion owns this element's `transform` entirely once that's true,
  // and it composes multiple motion-value sources (this + whileHover)
  // into one final transform on its own. Starts centered (0.5, 0.5) so
  // there's zero tilt until the pointer actually moves.
  const pointerX = useMotionValue(0.5)
  const pointerY = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [MAX_TILT_DEG, -MAX_TILT_DEG]), { stiffness: 300, damping: 22 })
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-MAX_TILT_DEG, MAX_TILT_DEG]), { stiffness: 300, damping: 22 })

  function handlePointerMove(e) {
    if (disabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    pointerX.set((e.clientX - rect.left) / rect.width)
    pointerY.set((e.clientY - rect.top) / rect.height)
  }
  function handlePointerLeave() {
    pointerX.set(0.5)
    pointerY.set(0.5)
  }

  return (
    <motion.div
      className={`hw-card hw-card--${ROLE_ACCENT[effectiveRole] || "skill"}`}
      data-disabled={!!disabled}
      data-selected={!!selected}
      data-portrait={!!def.image}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      // rotateX/rotateY: the cursor-tracked tilt above. transformPerspective
      // gives the tilt actual depth instead of a flat skew - a plain
      // px value here (not a token) since it's a 3D camera distance, not
      // a spacing/size measurement the Fibonacci scale applies to.
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      // Lift + scale on hover (box-shadow deepening itself lives in
      // heartwood.css, untouched by framer-motion). Disabled entirely
      // while the card is disabled/unaffordable so an un-clickable card
      // never invites a hover interaction it can't honor. The `transition`
      // lives INSIDE each gesture target, not as a top-level prop on this
      // element - a second top-level `transition` prop would just
      // silently overwrite the entrance one below (duplicate JSX
      // attributes resolve to the last one), which would have broken the
      // mount pop-in's own easeOut/duration. Per-target transitions are
      // framer-motion's supported way to give hover its own snappier
      // spring without touching that one.
      whileHover={disabled ? undefined : { scale: HOVER_SCALE, y: -HOVER_LIFT_PX, transition: { type: "spring", stiffness: 350, damping: 22 } }}
      whileTap={disabled ? undefined : { scale: HOVER_SCALE * 0.99, transition: { type: "spring", stiffness: 400, damping: 25 } }}
      // Rarity (Marc: "tehdään harvinaisuus systeemi peliin ja siihen
      // liittyville" - make a rarity system for the game and related
      // things) - a Tier 2 fusion result reads as "rare" regardless of
      // its base tier, matching displayTier's own "always the top
      // rarity" framing elsewhere in the UI.
      data-tier={def.displayTier === 2 ? "rare" : def.tier}
      // Golden/upgraded look (Hearthstone Battlegrounds' own "Golden"
      // convention for a tripled minion) - distinct from and layered on
      // top of the plain rare glow above, a PERSISTENT marker (not just
      // the one-shot hw-card--fused burst animation SquadDraft.jsx
      // already plays the moment a fusion completes) so a Tier 2 unit
      // still reads as special every time you see it afterward, not
      // just in that first instant.
      data-fused={def.displayTier === 2}
      data-tribe-match={!!tribeMatch}
      data-frozen={!!frozen}
      onClick={!disabled ? onClick : undefined}
      title={def.name}
      // A new shop offer or a freshly recruited bench card used to pop
      // in instantly - same one-time entrance EnemyPieceCard.jsx
      // already uses (fires once per stable key, so an existing card
      // re-rendering after some OTHER state change never replays it).
      initial={{ opacity: 0, scale: 0.85, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {frozen && (
        <span className="hw-frost-badge" title="Frozen - stays in the shop until your next visit">
          <CardGlyph name="moonGlyph" className="hw-effect-icon-glyph" />
        </span>
      )}
      <div className="hw-card-head">
        <span className="hw-card-cost">{def.recruitCost ?? "★"}</span>
        {/* Hearthstone-style glanceable corner stat: HP as a big,
            readable number instead of only appearing in the small text
            line below - "playable by eye," per Marc's own ask, not
            something you have to read a sentence to find. */}
        <span className="hw-card-hp" title="HP">
          <CardGlyph name="heart" className="hw-effect-icon-glyph" />
          {def.maxHp}
        </span>
      </div>
      {def.image ? (
        <img src={def.image} alt="" className="hw-card-portrait" />
      ) : (
        <CardGlyph name={def.art} className="hw-card-art" />
      )}
      <div className="hw-card-name">
        {def.name}
        {bent && (
          <span className="hw-badge hw-badge--bent" title={`Bent to ${effectiveRole}`}>
            Bent
          </span>
        )}
      </div>
      {/* Guild Identity v1 (Marc's PRD): a named Class identity, shown
          only for the units that have earned one so far (def.className -
          see units.js) - additive, every other unit's card renders
          exactly as before. */}
      {def.className && (
        <div className="hw-card-class" title={`${def.className} - a named Class identity`}>
          {def.className}
        </div>
      )}
      {tribeIds.length > 0 && (
        <div className="hw-tribe-icons">
          {tribeIds.map((t) => (
            <span
              key={t}
              className="hw-tribe-icon"
              style={{ color: TRIBES[t]?.color }}
              title={`${TRIBES[t]?.name} - ${synergyTiersSummary(t)}`}
            >
              <CardGlyph name={TRIBES[t]?.icon} className="hw-effect-icon-glyph" />
            </span>
          ))}
        </div>
      )}
      <div className="hw-effect-icons">
        {moves.map((m, i) => (
          <span key={i} className="hw-effect-icon">
            <CardGlyph name={ICON_BY_MOVE[m.type]} className="hw-effect-icon-glyph" />
            {m.amount}
          </span>
        ))}
      </div>
      <div className="hw-card-desc">
        {def.tier[0].toUpperCase() + def.tier.slice(1)}
        {def.displayTier === 2 ? " Tier 2" : ""}
        {def.attackPattern !== "single" ? ` · ${def.attackPattern}` : ""}
        {def.haste ? " · haste" : ""}
      </div>
    </motion.div>
  )
}
