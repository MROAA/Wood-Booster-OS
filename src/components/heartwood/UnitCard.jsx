import { motion } from "framer-motion"
import { CardGlyph } from "./cardArt"
import { TRIBES, tribesOf } from "../../data/heartwood/synergies"

const ICON_BY_MOVE = { attack: "sword", block: "shield", heal: "heart" }
const ROLE_ACCENT = { dps: "attack", tank: "power", support: "skill", hybrid: "skill" }

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
  return (
    <motion.div
      className={`hw-card hw-card--${ROLE_ACCENT[effectiveRole] || "skill"}`}
      data-disabled={!!disabled}
      data-selected={!!selected}
      data-portrait={!!def.image}
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
      {tribeIds.length > 0 && (
        <div className="hw-tribe-icons">
          {tribeIds.map((t) => (
            <span key={t} className="hw-tribe-icon" style={{ color: TRIBES[t]?.color }} title={TRIBES[t]?.name}>
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
