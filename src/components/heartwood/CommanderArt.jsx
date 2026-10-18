// Drop-in for the places that drew a Commander as a CardGlyph: a drawn
// hero (heroes.js) gets its avatar in the look the player chose, anything
// else keeps its glyph.

import HeroAvatar from "./HeroAvatar"
import { CardGlyph } from "./cardArt"
import { heroIdForArt } from "../../data/heartwood/heroes"
import { chosenSkinOf } from "../../services/heartwood/heroSkins"

export default function CommanderArt({ character, art, variant = "round", mood = "neutral", skin, className, style }) {
  const key = art || character?.art
  const heroId = (character?.id && heroIdForArt(key) === character.id ? character.id : null) || heroIdForArt(key)
  if (!heroId) return <CardGlyph name={key} className={className} style={style} />
  return <HeroAvatar heroId={heroId} variant={variant} mood={mood} skin={skin || chosenSkinOf(heroId)} className={`${className || ""} hwh-commander-art`} />
}
