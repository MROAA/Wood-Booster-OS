import "./HearthstoneCard.css";

// Standalone visual reference/prototype (src/ui_safe/ - deliberately
// not wired into the live game), not the actual UnitCard.jsx the game
// uses - kept separate on purpose per Marc's own Hearthstone-Battlegrounds
// visual reference (see HeartwoodBattle's own lunge-animation history).
// Plain JSX, not TypeScript - this project has no TS build step
// (no `typescript` package, every other component is plain .jsx); the
// file previously used `.tsx`-only syntax (a `type` alias + a generic
// on React.FC) while saved as `.jsx`, which would have failed to parse
// the moment anything actually imported it.
export function HearthstoneCard({
  title,
  cost,
  attack,
  health,
  rarity = "Common",
  description,
  image,
}) {
  return (
    <div className={`hs-card hs-card--${rarity.toLowerCase()}`}>
      <div className="hs-card-cost">{cost}</div>
      <div className="hs-card-art">
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="hs-card-art-placeholder">No art</div>
        )}
      </div>
      <div className="hs-card-title">{title}</div>
      <div className="hs-card-stats">
        <span className="hs-stat hs-stat--attack">{attack}</span>
        <span className="hs-stat hs-stat--health">{health}</span>
      </div>
      <div className="hs-card-text">{description}</div>
      <div className="hs-card-rarity">{rarity}</div>
    </div>
  );
}

export default HearthstoneCard;

