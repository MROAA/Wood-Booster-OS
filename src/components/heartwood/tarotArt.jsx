// Heartwood Trial - one recognizable line-art glyph per Tarot Major
// Arcana card, in the same minimalist stroke style as the rest of
// cardArt.jsx (viewBox 0 0 48 48, tinted via currentColor). Each one
// depicts the card's real traditional imagery (a figure at a cliff
// edge, a lion, a wheel, a struck tower...) rather than a generic
// shape - simple enough to read at card size, still specific to the
// card, per Marc's own request: "tee ne tarottien mukaan" (make them
// according to the tarot cards).

const STROKE = { strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" }

export function TheFool() {
  return (
    <g {...STROKE}>
      <circle cx="22" cy="10" r="4" />
      <path d="M22 14 L22 26 M22 17 L13 12 M22 26 L16 40 M22 26 L29 38" />
      <path d="M6 42 L20 42" />
    </g>
  )
}

export function TheMagician() {
  return (
    <g {...STROKE}>
      <circle cx="24" cy="10" r="4" />
      <path d="M24 14 L24 28 M24 17 L35 7 M24 20 L16 29 M24 28 L18 42 M24 28 L30 42" />
      <path d="M10 34 L38 34" />
    </g>
  )
}

export function TheHighPriestess() {
  return (
    <g {...STROKE}>
      <path d="M8 8 L8 40 M40 8 L40 40" />
      <circle cx="24" cy="16" r="3.5" />
      <path d="M16 22 L32 22 L24 40 Z" />
      <path d="M20 44 A5 4 0 1 0 20 43.9" />
    </g>
  )
}

export function TheEmpress() {
  return (
    <g {...STROKE}>
      <path d="M18 8 A6 4 0 0 1 30 8" />
      <circle cx="24" cy="12" r="3.5" />
      <path d="M14 18 L34 18 L24 42 Z" />
      <path d="M10 26 L14 22 M10 30 L14 27 M38 26 L34 22 M38 30 L34 27" />
    </g>
  )
}

export function TheEmperor() {
  return (
    <g {...STROKE}>
      <path d="M12 8 L36 8 L36 42 L12 42 Z" />
      <circle cx="24" cy="16" r="3.5" />
      <path d="M18 22 L30 22 L26 36 L22 36 Z" />
      <path d="M32 20 L40 12 M40 12 L40 20 M40 12 L34 12" />
    </g>
  )
}

export function TheHierophant() {
  return (
    <g {...STROKE}>
      <path d="M18 8 L30 8 M24 4 L24 8" />
      <circle cx="24" cy="14" r="3.5" />
      <path d="M16 20 L32 20 L28 42 L20 42 Z" />
      <path d="M32 24 L38 18" />
      <path d="M12 44 L12 24" />
    </g>
  )
}

export function TheLovers() {
  return (
    <g {...STROKE}>
      <circle cx="15" cy="14" r="3.5" />
      <path d="M15 18 L15 38 M15 24 L10 32 M15 24 L20 30" />
      <circle cx="33" cy="14" r="3.5" />
      <path d="M33 18 L33 38 M33 24 L28 30 M33 24 L38 32" />
      <path d="M24 6 C21 3 17 5 18 9 C19 12 24 15 24 15 C24 15 29 12 30 9 C31 5 27 3 24 6 Z" fill="currentColor" stroke="none" />
    </g>
  )
}

export function TheChariot() {
  return (
    <g {...STROKE}>
      <path d="M24 4 L18 12 L30 12 Z" fill="currentColor" stroke="none" />
      <path d="M12 18 L36 18 L34 34 L14 34 Z" />
      <path d="M18 18 L18 34 M30 18 L30 34" />
      <circle cx="15" cy="38" r="5" />
      <circle cx="33" cy="38" r="5" />
    </g>
  )
}

export function Strength() {
  return (
    <g {...STROKE}>
      <path d="M20 8 C20 5 23 5 23 8 C23 5 26 5 26 8 C26 11 23 10 23 10 C23 10 20 11 20 8 Z" />
      <circle cx="16" cy="18" r="3.5" />
      <path d="M16 22 L16 38 M16 26 L10 34" />
      <path d="M22 30 C22 22 30 18 38 22 C44 25 42 34 34 34 C30 34 27 32 22 30 Z" />
      <path d="M20 27 L26 27" />
    </g>
  )
}

export function TheHermit() {
  return (
    <g {...STROKE}>
      <path d="M24 8 L14 42 L34 42 Z" />
      <path d="M18 12 A6 6 0 0 1 30 12" />
      <circle cx="10" cy="26" r="3" />
      <path d="M10 23 L10 18 M8 15 L12 15" />
      <path d="M8 24 L4 30" />
    </g>
  )
}

export function WheelOfFortune() {
  return (
    <g {...STROKE}>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="4" />
      <path d="M24 8 L24 40 M8 24 L40 24 M13 13 L35 35 M13 35 L35 13" />
    </g>
  )
}

export function Justice() {
  return (
    <g {...STROKE}>
      <circle cx="24" cy="8" r="3" />
      <path d="M24 11 L24 30 M24 32 L18 42 M24 32 L30 42" />
      <path d="M10 16 L38 16" />
      <path d="M10 16 L7 24 A5 4 0 0 0 13 24 Z" />
      <path d="M38 16 L35 24 A5 4 0 0 0 41 24 Z" />
    </g>
  )
}

export function TheHangedMan() {
  return (
    <g {...STROKE}>
      <path d="M8 8 L40 8" />
      <path d="M26 8 L26 16" />
      <circle cx="24" cy="30" r="4" />
      <path d="M26 16 L26 22 M26 22 L16 26 M26 22 L34 18 M16 26 L10 22 M16 26 L20 34" />
    </g>
  )
}

export function Death() {
  return (
    <g {...STROKE}>
      <circle cx="24" cy="16" r="8" />
      <circle cx="21" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="27" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <path d="M22 20 L26 20" />
      <path d="M14 32 L34 40 M34 32 L14 40" />
    </g>
  )
}

export function Temperance() {
  return (
    <g {...STROKE}>
      <circle cx="24" cy="10" r="3.5" />
      <path d="M24 14 L24 32 M24 18 L12 14 M24 18 L36 14" />
      <path d="M8 10 L16 18 M40 10 L32 18" />
      <path d="M12 12 L16 20 L8 20 Z" />
      <path d="M36 12 L40 20 L32 20 Z" />
    </g>
  )
}

export function TheDevil() {
  return (
    <g {...STROKE}>
      <path d="M18 10 L14 4 M30 10 L34 4" />
      <circle cx="24" cy="14" r="4" />
      <path d="M16 20 L32 20 L28 40 L20 40 Z" />
      <path d="M14 22 L8 18 L10 26 Z" />
      <path d="M34 22 L40 18 L38 26 Z" />
      <path d="M12 40 A6 4 0 0 0 24 40 A6 4 0 0 0 36 40" />
    </g>
  )
}

export function TheTower() {
  return (
    <g {...STROKE}>
      <path d="M17 44 L17 10 L20 6 L28 6 L31 10 L31 44" />
      <path d="M17 16 L31 16 M17 30 L31 30" />
      <path d="M38 4 L28 18 L34 18 L24 34" />
      <path d="M12 40 L6 46 M36 40 L42 46" />
    </g>
  )
}

export function TheStar() {
  return (
    <g {...STROKE}>
      <path d="M24 4 L27 14 L37 14 L29 20 L32 30 L24 24 L16 30 L19 20 L11 14 L21 14 Z" />
      <path d="M18 34 C18 30 22 30 22 34 L22 40" />
      <path d="M30 34 C30 30 26 30 26 34 L26 40" />
    </g>
  )
}

export function TheMoon() {
  return (
    <g {...STROKE}>
      <path d="M28 8 A10 10 0 1 0 28 28 A8 8 0 1 1 28 8 Z" />
      <path d="M8 44 L8 30 L14 30 L14 44 M34 44 L34 30 L40 30 L40 44" />
      <path d="M4 44 C12 36 20 42 24 38 C28 34 36 40 44 34" />
    </g>
  )
}

export function TheSun() {
  return (
    <g {...STROKE}>
      <circle cx="24" cy="18" r="8" />
      <path d="M24 4 L24 8 M24 28 L24 32 M10 18 L14 18 M34 18 L38 18 M14 8 L17 11 M34 8 L31 11" />
      <path d="M14 38 L18 42 M34 38 L30 42" />
      <path d="M18 44 L24 36 L30 44" />
    </g>
  )
}

export function Judgement() {
  return (
    <g {...STROKE}>
      <path d="M24 6 L18 12 L30 12 Z" fill="currentColor" stroke="none" />
      <path d="M16 44 L16 36 L32 36 L32 44" />
      <circle cx="24" cy="26" r="4" />
      <path d="M24 30 L24 36 M24 28 L16 22 M24 28 L32 22" />
    </g>
  )
}

export function TheWorld() {
  return (
    <g {...STROKE}>
      <path d="M24 6 A18 18 0 1 1 23.9 6" />
      <circle cx="16" cy="16" r="3" />
      <path d="M16 19 L16 30 M16 23 L11 19 M16 23 L21 27 M16 30 L12 36 M16 30 L20 36" />
    </g>
  )
}

export function Entropy() {
  return (
    <g {...STROKE}>
      <path d="M8 24 C8 14 16 8 24 8 C32 8 40 14 40 24 C40 34 32 40 24 40" strokeDasharray="3 4" />
      <path d="M24 40 L24 28 M24 28 L18 34 M24 28 L30 22" />
      <circle cx="24" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </g>
  )
}
