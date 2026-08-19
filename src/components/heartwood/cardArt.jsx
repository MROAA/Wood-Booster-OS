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

function Husk() {
  return (
    <path
      d="M18 42 L18 14 C18 9 30 9 30 14 L30 42 M22 42 L22 20 C22 17 26 17 26 20 L26 42"
      fill="none"
      strokeWidth="2"
    />
  )
}

function Troll() {
  return (
    <path
      d="M24 8 A8 8 0 1 1 23.9 8 M14 40 L14 26 C14 20 34 20 34 26 L34 40 M14 30 L8 34 M34 30 L40 34"
      fill="none"
      strokeWidth="2"
    />
  )
}

function Warden() {
  return (
    <path
      d="M24 6 L38 12 L38 24 C38 34 32 40 24 42 C16 40 10 34 10 24 L10 12 Z M24 16 L24 32 M17 24 L31 24"
      fill="none"
      strokeWidth="2"
    />
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
}

export function CardGlyph({ name, className }) {
  const Glyph = GLYPHS[name] || Rune
  return (
    <svg viewBox="0 0 48 48" className={className} stroke="currentColor" fill="none">
      <Glyph />
    </svg>
  )
}
