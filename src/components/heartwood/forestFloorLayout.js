// Hearthwood battlefield - forest floor layout (pure, no React).
// Plan: docs/hearthwood-battlefield-plan.md. Decides WHERE the floor
// details and ground patches of ForestFloor.jsx go, and turns a biome's
// palette into the board's CSS custom properties. Presentation only: a
// private hash, never the game's seeded RNG streams.
//
// Public API: floorDetailLayout(biome, grid, terrain, salt) -> details[],
// biomeBoardStyle(biome) -> style object, hashString(str) -> uint32,
// geometry constants PAD / CELL / GAP / STEP.

// Board geometry (heartwood-tactics.css .hwt-board): 10px padding, 76px
// tiles, 3px gaps. The SVG viewBox is in these pixel units and stretches
// with the board if a media query ever resizes the tiles.
export const PAD = 10
export const CELL = 76
export const GAP = 3
export const STEP = CELL + GAP

// --- deterministic randomness (presentation only) ---------------------------
export function hashString(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pickOne = (rng, list) => list[Math.floor(rng() * list.length) % list.length]
function pickWeighted(rng, weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0)
  const total = entries.reduce((s, [, w]) => s + w, 0)
  let roll = rng() * total
  for (const [kind, w] of entries) {
    roll -= w
    if (roll < 0) return kind
  }
  return entries[entries.length - 1][0]
}

// Spots inside a tile where a detail may sit: corners and edge middles,
// as fractions of the tile. The middle (unit space) is never used.
const SLOTS = [
  [0.17, 0.17],
  [0.83, 0.17],
  [0.17, 0.83],
  [0.83, 0.83],
  [0.5, 0.1],
  [0.5, 0.9],
  [0.1, 0.5],
  [0.9, 0.5],
]

// Terrain that floor life gathers around (biome.detail.near keys).
const neighbourFeatures = (terrain, grid, row, col) => {
  const found = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const r = row + dr
      const c = col + dc
      if (r < 0 || c < 0 || r >= grid.rows || c >= grid.cols) continue
      const t = terrain?.[`${r}-${c}`]
      if (t && t !== "path") found.push(t)
    }
  }
  return found
}

// Pure layout: which details and ground patches go where (pixel coords in
// the viewBox). Exported so a verify check can recompute it independently.
// Busier next to trees / rocks / water and along the board's rim, calmer in
// the open middle - nature gathers around things.
export function floorDetailLayout(biome, grid, terrain, salt) {
  const out = []
  const d = biome?.detail
  if (!d || !grid) return out
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const t = terrain?.[`${row}-${col}`]
      if (t && t !== "path") continue
      const rng = mulberry32(hashString(`${salt}|${row}-${col}`))
      const near = neighbourFeatures(terrain, grid, row, col).filter((f) => d.near?.[f])
      const rim = row === 0 || col === 0 || row === grid.rows - 1 || col === grid.cols - 1
      const x0 = PAD + col * STEP
      const y0 = PAD + row * STEP
      // ground patch straddling this tile's edge (drawn under the details)
      const pc = d.patches
      if (pc && rng() < pc.chance + (near.length ? 0.25 : 0)) {
        const edge = Math.floor(rng() * 4)
        const along = 0.2 + rng() * 0.6
        const [fx, fy] = [
          [along, 0],
          [1, along],
          [along, 1],
          [0, along],
        ][edge]
        out.push({
          key: `${row}-${col}-p`,
          kind: "patch",
          x: x0 + fx * CELL + (fx === 1 ? GAP / 2 : fx === 0 ? -GAP / 2 : 0),
          y: y0 + fy * CELL + (fy === 1 ? GAP / 2 : fy === 0 ? -GAP / 2 : 0),
          rot: Math.round(rng() * 180),
          scale: 0.8 + rng() * 0.7,
          tone: rng(),
          tone2: rng(),
          colour: rng() < 0.55 ? pc.moss : pc.litter,
        })
      }
      const density = Math.min(0.97, d.density * 0.62 + (near.length ? 0.3 : 0) + (rim ? 0.12 : 0))
      if (rng() > density) continue
      const count = Math.min(SLOTS.length, 1 + Math.floor(rng() * d.perTile) + (near.length ? 1 : 0))
      const slots = [...SLOTS.keys()].sort((a, b) => hashString(`${salt}${row}${col}${a}`) - hashString(`${salt}${row}${col}${b}`))
      for (let i = 0; i < count; i++) {
        const [fx, fy] = SLOTS[slots[i]]
        const kind = near.length && rng() < 0.65 ? pickWeighted(rng, d.near[pickOne(rng, near)]) : pickWeighted(rng, d.weights)
        out.push({
          key: `${row}-${col}-${i}`,
          kind,
          x: x0 + (fx + (rng() - 0.5) * 0.08) * CELL,
          y: y0 + (fy + (rng() - 0.5) * 0.08) * CELL,
          rot: Math.round(rng() * 360),
          scale: 1.2 + rng() * 0.45,
          tone: rng(),
          tone2: rng(),
        })
      }
    }
  }
  return out
}

// The biome's floor textures as CSS custom properties for the board
// (moss blots + copper leaf litter, tinted from the palette).
const noise = (rgb, freq, seed, alpha, size) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='3' seed='${seed}'/><feColorMatrix values='0 0 0 0 ${rgb[0]} 0 0 0 0 ${rgb[1]} 0 0 0 0 ${rgb[2]} 0 0 0 1 ${alpha}'/></filter><rect width='${size}' height='${size}' filter='url(#n)'/></svg>`,
  )}")`
export function biomeBoardStyle(biome) {
  const p = biome.palette
  return {
    "--hwt-floor-a": p.floorA,
    "--hwt-floor-b": p.floorB,
    "--hwt-floor-c": p.floorC,
    "--hwt-moss-blots": noise(p.moss, 0.012, 7, -0.52, 300),
    "--hwt-litter-blots": noise(p.litter, 0.02, 23, p.litterAlpha ?? -0.5, 260),
    "--hwt-biome-light": p.light,
  }
}
