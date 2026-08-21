// Heartwood Trial - a small reusable set of geometric/abstract SVG
// glyphs. No painted or photographic art - every card and enemy reuses
// one of these by key (see the `art` field in data/heartwood/*.js),
// tinted via `currentColor` so CSS controls the accent per card type.

import * as Tarot from "./tarotArt"

function Leaf() {
  return (
    <path d="M24 8 C34 12 38 22 34 32 C30 40 20 42 12 38 C16 30 14 18 24 8 Z M24 8 L18 34" fill="none" strokeWidth="2" />
  )
}

function Spark() {
  return (
    <path d="M24 6 L28 20 L42 24 L28 28 L24 42 L20 28 L6 24 L20 20 Z" fill="currentColor" stroke="none" />
  )
}

function MoonGlyph() {
  return <path d="M30 8 A18 18 0 1 0 30 40 A13 13 0 1 1 30 8 Z" fill="currentColor" stroke="none" />
}

function Root() {
  return (
    <path
      d="M24 6 L24 22 M24 22 L12 40 M24 22 L24 42 M24 22 L36 40 M14 30 L20 30 M28 30 L34 30"
      fill="none"
      strokeWidth="2"
    />
  )
}

function Rune() {
  return (
    <path
      d="M24 6 L24 42 M14 14 L34 22 M34 14 L14 22 M16 32 L32 32"
      fill="none"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  )
}

function Flame() {
  return (
    <path
      d="M24 6 C30 16 34 20 30 30 C28 36 20 38 16 32 C12 26 16 22 18 26 C16 16 20 10 24 6 Z"
      fill="currentColor"
      stroke="none"
    />
  )
}

// Enemy portraits redrawn in a crude, thick-outline doodle style, from
// Marc's own hand-drawn character sketches - dot eyes, simple curved
// mouths, wobbly confident linework. A deliberately different register
// from the clean geometric card glyphs above: these are creatures, not
// symbols.
function Husk() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 38 C10 24 14 8 24 6 C34 8 38 24 34 38" fill="none" />
      <circle cx="19" cy="22" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="22" r="1.6" fill="currentColor" stroke="none" />
      <path d="M18 29 C21 32 27 32 30 29" fill="none" />
      <path d="M14 38 L10 44 M34 38 L38 44 M22 40 L20 46 M26 40 L28 46" fill="none" />
    </g>
  )
}

function Troll() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 24 C14 12 20 4 24 4 C28 4 34 12 32 24" fill="none" />
      <path d="M11 44 L13 25 C13 20 35 20 35 25 L37 44" fill="none" />
      <path d="M17 16 L22 13 M31 16 L26 13" fill="none" />
      <circle cx="20" cy="21" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28" cy="21" r="1.6" fill="currentColor" stroke="none" />
      <path d="M18 28 L22 25 L26 28 L30 25" fill="none" />
      <path d="M13 30 L6 36 M35 30 L42 36" fill="none" />
    </g>
  )
}

function Warden() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 4 L36 10 L34 28 C33 36 28 41 24 43 C20 41 15 36 14 28 L12 10 Z" fill="none" />
      <path d="M18 15 L24 12 L30 16" fill="none" />
      <circle cx="20" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28" cy="20" r="1.6" fill="currentColor" stroke="none" />
      <path d="M20 27 L28 27" fill="none" />
      <path d="M24 31 L24 40" fill="none" />
    </g>
  )
}

// Small, bold, instantly-readable action icons - used as icon+number
// pairs (not sentences) so the game reads visually at a glance: what a
// card does, what an enemy is about to do.
// Bold and simple on purpose: at the small sizes this renders at (an
// intent badge, an in-card effect row) fine linework disappears, so
// this reads as one solid upward blade rather than a literal sword.
function SwordIcon() {
  return (
    <path
      d="M24 4 L32 24 L27 24 L27 44 L21 44 L21 24 L16 24 Z"
      fill="currentColor"
      stroke="none"
    />
  )
}

function ShieldIcon() {
  return (
    <path
      d="M24 5 L38 11 L36 27 C35 35 30 41 24 43 C18 41 13 35 12 27 L10 11 Z"
      fill="currentColor"
      stroke="none"
    />
  )
}

function HeartIcon() {
  return (
    <path
      d="M24 42 C10 32 6 22 12 15 C17 9 24 12 24 19 C24 12 31 9 36 15 C42 22 38 32 24 42 Z"
      fill="currentColor"
      stroke="none"
    />
  )
}

function DrawIcon() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <rect x="10" y="8" width="20" height="28" rx="3" />
      <rect x="18" y="14" width="20" height="28" rx="3" fill="var(--hw-card, #211d19)" />
    </g>
  )
}

// Playable-character portraits, same crude thick-outline doodle
// register as the enemy glyphs above.
function CatGlyph() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16 L10 6 L19 11 M34 16 L38 6 L29 11" fill="none" />
      <path d="M14 18 C12 24 14 29 18 30 C22 31 26 31 30 30 C34 29 36 24 34 18 C32 13 16 13 14 18 Z" fill="none" />
      <circle cx="19" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <path d="M20 25 C22 27 26 27 28 25" fill="none" />
      <path d="M17 32 C15 36 15 40 18 44 M31 32 C33 36 33 40 30 44" fill="none" />
      <path d="M34 30 C40 30 42 34 38 38" fill="none" />
    </g>
  )
}

function ReindeerGlyph() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 10 L8 2 M14 10 L18 3 M34 10 L40 2 M34 10 L30 3" fill="none" />
      <path d="M15 16 C13 22 15 27 19 28 C23 29 25 29 29 28 C33 27 35 22 33 16 C31 12 17 12 15 16 Z" fill="none" />
      <circle cx="20" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <path d="M21 24 L27 24" fill="none" />
      <path d="M17 30 L16 44 M31 30 L32 44" fill="none" />
    </g>
  )
}

function WolfGlyph() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 12 L9 3 L17 8 M35 12 L39 3 L31 8" fill="none" />
      <path d="M14 16 C12 22 14 27 18 28 L24 25 L30 28 C34 27 36 22 34 16 C31 11 17 11 14 16 Z" fill="none" />
      <circle cx="19" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="18" r="1.6" fill="currentColor" stroke="none" />
      <path d="M21 23 L24 26 L27 23" fill="none" />
      <path d="M18 30 C14 34 14 40 18 44 M30 30 C34 34 34 40 30 44" fill="none" />
    </g>
  )
}

// Two more enemy portraits, same crude thick-outline register, this
// time redrawn from Marc's newest round of sketches (his own doodles
// of a fisted brute and an angry cloud-maw creature).
function BarkBrute() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 14 L6 6 M38 14 L42 6" fill="none" />
      <path
        d="M13 24 C11 14 17 6 24 6 C31 6 37 14 35 24 L33 34 C31 40 26 43 24 43 C22 43 17 40 15 34 Z"
        fill="none"
      />
      <path d="M15 18 L21 21 M33 18 L27 21" fill="none" />
      <circle cx="19" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <path d="M17 31 L21 31 M23 31 L27 31 M29 31 L33 31" fill="none" />
      <path d="M35 26 L44 22 L46 14 L42 12 L40 18 L36 20" fill="none" />
    </g>
  )
}

function MistGrowler() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M8 20 C4 14 10 8 16 10 C18 4 28 4 30 10 C36 8 42 14 38 20 C42 24 40 32 32 32 C30 38 18 38 16 32 C8 32 4 26 8 20 Z"
        fill="none"
      />
      <path d="M14 18 L20 20 M34 18 L28 20" fill="none" />
      <path d="M18 22 L18 26 M28 22 L28 26" fill="none" />
      <path d="M13 28 L17 25 L21 28 L25 25 L29 28 L33 25 L36 28" fill="none" />
    </g>
  )
}

// The run's final boss - same crude doodle register as the mooks above,
// but with small horn-hints alongside the round monkey ears, a nod to
// the "pikku-paholainen" alter-ego lore rather than a redesign.
function SpacemonkeyBoss() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6" fill="none" />
      <circle cx="36" cy="14" r="6" fill="none" />
      <path d="M18 8 L20 4 M30 8 L28 4" fill="none" />
      <path
        d="M14 20 C12 12 16 5 24 5 C32 5 36 12 34 20 C36 26 34 34 24 38 C14 34 12 26 14 20 Z"
        fill="none"
      />
      <circle cx="18" cy="20" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="30" cy="20" r="1.6" fill="currentColor" stroke="none" />
      <path d="M15 27 C19 32 29 32 33 27" fill="none" />
      <path d="M17 30 L19 27 M21 31 L21 28 M27 31 L27 28 M31 30 L29 27" fill="none" />
    </g>
  )
}

// Two new recruitable-unit portraits, same crude thick-outline
// register as the enemy/character glyphs above - original designs
// (not traced from anything), only loosely inspired by mood/theme from
// Marc's own doodles (a horned quadruped sketch) and a folder of
// downloaded fantasy-art reference he pointed at for atmosphere - none
// of those reference images are reproduced here, since the game is
// meant for public release and that art isn't Marc's to use directly.
function EmberStag() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 14 L10 2 L15 12 M18 12 L15 0 M32 14 L38 2 L33 12 M30 12 L33 0" fill="none" />
      <path d="M15 18 C13 24 15 29 19 30 C23 31 27 31 31 30 C35 29 37 24 35 18 C33 13 17 13 15 18 Z" fill="none" />
      <circle cx="19" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="19" r="1.6" fill="currentColor" stroke="none" />
      <path d="M20 25 L28 25" fill="none" />
      <path d="M17 32 L14 44 M31 32 L34 44" fill="none" />
    </g>
  )
}

function Grovekeeper() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M24 4 C34 8 38 18 34 26 C38 30 36 38 28 40 C30 34 26 30 24 30 C22 30 18 34 20 40 C12 38 10 30 14 26 C10 18 14 8 24 4 Z"
        fill="none"
      />
      <circle cx="19" cy="20" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="20" r="1.6" fill="currentColor" stroke="none" />
      <path d="M18 26 C21 29 27 29 30 26" fill="none" />
      <path d="M14 26 L8 30 M34 26 L40 30" fill="none" />
    </g>
  )
}

// A third recruitable-unit glyph - a storm-bird, distinct silhouette
// from Ember Stag's antlers/Grovekeeper's tree-canopy so all three
// forest-creature units still read apart from each other at a glance.
function Stormwing() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 6 L24 44 M24 20 C10 12 4 16 2 24 C10 24 18 24 24 20 M24 20 C38 12 44 16 46 24 C38 24 30 24 24 20" fill="none" />
      <circle cx="24" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <path d="M22 8 L24 4 L26 8" fill="none" />
    </g>
  )
}

const GLYPHS = {
  leaf: Leaf,
  spark: Spark,
  moonGlyph: MoonGlyph,
  root: Root,
  rune: Rune,
  flame: Flame,
  husk: Husk,
  troll: Troll,
  warden: Warden,
  barkBrute: BarkBrute,
  mistGrowler: MistGrowler,
  spacemonkeyBoss: SpacemonkeyBoss,
  sword: SwordIcon,
  shield: ShieldIcon,
  heart: HeartIcon,
  drawIcon: DrawIcon,
  cat: CatGlyph,
  reindeer: ReindeerGlyph,
  wolf: WolfGlyph,
  emberStag: EmberStag,
  grovekeeper: Grovekeeper,
  stormwing: Stormwing,

  "the-fool": Tarot.TheFool,
  "the-magician": Tarot.TheMagician,
  "the-high-priestess": Tarot.TheHighPriestess,
  "the-empress": Tarot.TheEmpress,
  "the-emperor": Tarot.TheEmperor,
  "the-hierophant": Tarot.TheHierophant,
  "the-lovers": Tarot.TheLovers,
  "the-chariot": Tarot.TheChariot,
  strength: Tarot.Strength,
  "the-hermit": Tarot.TheHermit,
  "wheel-of-fortune": Tarot.WheelOfFortune,
  justice: Tarot.Justice,
  "the-hanged-man": Tarot.TheHangedMan,
  death: Tarot.Death,
  temperance: Tarot.Temperance,
  "the-devil": Tarot.TheDevil,
  "the-tower": Tarot.TheTower,
  "the-star": Tarot.TheStar,
  "the-moon": Tarot.TheMoon,
  "the-sun": Tarot.TheSun,
  judgement: Tarot.Judgement,
  "the-world": Tarot.TheWorld,
  entropy: Tarot.Entropy,
}

// "woundedFury" -> "Wounded Fury" - power/status ids are camelCase
// internally, but should read as words wherever shown to the player.
export function formatPowerLabel(id) {
  const spaced = id.replace(/([a-z])([A-Z])/g, "$1 $2")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function CardGlyph({ name, className }) {
  const Glyph = GLYPHS[name] || Rune
  return (
    <svg viewBox="0 0 48 48" className={className} stroke="currentColor" fill="none">
      <Glyph />
    </svg>
  )
}
