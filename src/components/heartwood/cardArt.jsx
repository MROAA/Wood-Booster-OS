// Heartwood Trial - a small reusable set of geometric/abstract SVG
// glyphs. No painted or photographic art - every card and enemy reuses
// one of these by key (see the `art` field in data/heartwood/*.js),
// tinted via `currentColor` so CSS controls the accent per card type.

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
      <path d="M14 40 C10 26 14 10 24 8 C34 10 38 26 34 40" fill="none" />
      <circle cx="19" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <path d="M18 31 C21 34 27 34 30 31" fill="none" />
      <path d="M10 41 L38 41" fill="none" />
    </g>
  )
}

function Troll() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 26 C14 14 20 6 24 6 C28 6 34 14 32 26" fill="none" />
      <path d="M12 40 L14 27 C14 22 34 22 34 27 L36 40" fill="none" />
      <path d="M17 18 L22 15 M31 18 L26 15" fill="none" />
      <circle cx="20" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <path d="M18 30 L22 27 L26 30 L30 27" fill="none" />
    </g>
  )
}

function Warden() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 6 L36 12 L34 30 C33 36 28 40 24 41 C20 40 15 36 14 30 L12 12 Z" fill="none" />
      <path d="M18 17 L24 14 L30 18" fill="none" />
      <circle cx="20" cy="21" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28" cy="22" r="1.6" fill="currentColor" stroke="none" />
      <path d="M20 29 L28 29" fill="none" />
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
      <path d="M14 20 L10 8 L20 14 M34 20 L38 8 L28 14" fill="none" />
      <path d="M13 22 C11 30 14 40 24 40 C34 40 37 30 35 22 C33 15 15 15 13 22 Z" fill="none" />
      <circle cx="19" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="24" r="1.6" fill="currentColor" stroke="none" />
      <path d="M20 30 C22 32 26 32 28 30" fill="none" />
      <path d="M12 28 L6 27 M12 31 L6 33 M36 28 L42 27 M36 31 L42 33" fill="none" />
    </g>
  )
}

function ReindeerGlyph() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14 L8 4 M14 14 L18 6 M34 14 L40 4 M34 14 L30 6" fill="none" />
      <path d="M15 20 C13 30 16 40 24 40 C32 40 35 30 33 20 C31 14 17 14 15 20 Z" fill="none" />
      <circle cx="20" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="28" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <path d="M21 31 L27 31" fill="none" />
    </g>
  )
}

function WolfGlyph() {
  return (
    <g strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 16 L9 6 L17 12 M35 16 L39 6 L31 12" fill="none" />
      <path d="M14 20 C12 28 14 36 20 38 L24 34 L28 38 C34 36 36 28 34 20 C30 14 18 14 14 20 Z" fill="none" />
      <circle cx="19" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="29" cy="23" r="1.6" fill="currentColor" stroke="none" />
      <path d="M21 28 L24 31 L27 28" fill="none" />
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
  sword: SwordIcon,
  shield: ShieldIcon,
  heart: HeartIcon,
  drawIcon: DrawIcon,
  cat: CatGlyph,
  reindeer: ReindeerGlyph,
  wolf: WolfGlyph,
}

export function CardGlyph({ name, className }) {
  const Glyph = GLYPHS[name] || Rune
  return (
    <svg viewBox="0 0 48 48" className={className} stroke="currentColor" fill="none">
      <Glyph />
    </svg>
  )
}
