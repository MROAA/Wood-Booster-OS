// Drop-in for the places that draw a Commander. Order of preference:
//   1. Marc's own painting (characters.js `image`) - always, in every look;
//   2. the drawn hero (HeroAvatar, heroes.js) - Commanders without a
//      painting yet;
//   3. the old CardGlyph for anything else.

import HeroAvatar from "./HeroAvatar"
import { CardGlyph } from "./cardArt"
import { heroIdForArt } from "../../data/heartwood/heroes"
import { chosenSkinOf } from "../../services/heartwood/heroSkins"

export function commanderHeroId(character, art) {
  return heroIdForArt(art || character?.art)
}

// Marc (2026-10-19): a Commander with his painting is ONLY ever shown as
// the painting - no drawn version, no drawn rare looks.
export function commanderShowsImage(character) {
  return !!character?.image
}

export default function CommanderArt({ character, art, variant = "round", mood = "neutral", skin, className, imgClassName, style }) {
  const heroId = commanderHeroId(character, art)
  const worn = skin || (heroId ? chosenSkinOf(heroId) : "default")
  if (commanderShowsImage(character)) {
    return <img className={imgClassName || className} src={character.image} alt={character.name || ""} draggable={false} data-mood={mood} data-commander-image={character.id} />
  }
  if (!heroId) return <CardGlyph name={art || character?.art} className={className} style={style} />
  return <HeroAvatar heroId={heroId} variant={variant} mood={mood} skin={worn} className={`${className || ""} hwh-commander-art`} />
}
