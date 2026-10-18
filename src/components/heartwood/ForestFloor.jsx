// Hearthwood battlefield - the living forest floor (plan:
// docs/hearthwood-battlefield-plan.md §2 layers 1-2, piece 2 "the look").
//
// Purpose: one light SVG layer under the board's cells that fills the empty
// forest floor with small natural detail (aspen leaves, fly agarics,
// chanterelles, lingonberry sprigs, cones, fern, twigs, pebbles, moss tufts,
// little flowers) and frames the field with old roots creeping in from the
// corners. Everything comes from the battle's biome (battleBiomes.js).
//
// Readability rules: details sit only in the outer ring of a tile (the
// centre stays free for the unit), never on a terrain tile, and the layer is
// drawn BEFORE the cells so units, highlights and telegraphs always paint
// on top. Placement is a pure hash of (salt, tile) - the same battle keeps
// the same floor, and a tile's details never jump when the board re-renders.
//
// Pure presentation: no game rules, no game RNG streams touched.
import { memo, useMemo } from "react"
import { PAD, CELL, GAP, STEP, floorDetailLayout, hashString } from "./forestFloorLayout"

// --- the detail sprites (centred on 0,0, roughly 8-18px) ----------------------
const pickOne = (rng, list) => list[Math.floor(rng() * list.length) % list.length]
const shade = (rx, ry, y = 2) => <ellipse cx="0" cy={y} rx={rx} ry={ry} fill="#000" opacity=".28" />

function Leaf({ c, r = 0, x = 0, y = 0, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0-7C4.6-5 5.2 2.6 0 7C-5.2 2.6-4.6-5 0-7Z" fill={c} stroke="#000" strokeOpacity=".28" strokeWidth=".6" />
      <path d="M0-6V8.5M0-2l2.4-1.6M0 1l-2.6-1.8M0 3.6l2.2-1.4" stroke="#000" strokeOpacity=".3" strokeWidth=".5" fill="none" />
    </g>
  )
}

const DETAIL_ART = {
  leaf: ({ c }) => <Leaf c={pickOne(c.r1, c.leaf)} />,
  leaves: ({ c }) => (
    <>
      {shade(9, 4, 2)}
      <Leaf c={pickOne(c.r1, c.leaf)} x={-4} y={1} r={-40} s={0.9} />
      <Leaf c={pickOne(c.r2, c.leaf)} x={4} y={-1} r={35} />
      <Leaf c={c.leaf[0]} x={0} y={4} r={95} s={0.8} />
    </>
  ),
  flower: ({ c }) => {
    const petal = pickOne(c.r1, c.flower)
    return (
      <>
        <path d="M0 1q-1 4 0 7M0 5q-3-1-4 1M0 6q3-2 4 0" stroke="#3f5a26" strokeWidth=".8" fill="none" />
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-2.4" rx="1.5" ry="2.3" fill={petal} transform={`rotate(${a})`} opacity=".92" />
        ))}
        <circle r="1.3" fill="#e2b84a" />
      </>
    )
  },
  // kärpässieni - fly agaric
  toadstool: () => (
    <>
      {shade(6, 2, 6)}
      <path d="M-1.6 6q-.6-4 .4-7h2.4q1 3 .4 7z" fill="#e6dcc0" />
      <path d="M-7 0Q-6.5-7 0-7.5Q6.5-7 7 0Q0 2-7 0Z" fill="#a8321f" />
      <path d="M-5-2.5q2-4 6-4.4q-4 2-5 5z" fill="#d0583a" opacity=".7" />
      <circle cx="-3" cy="-3.5" r=".9" fill="#f1ead6" />
      <circle cx="1.5" cy="-5" r=".8" fill="#f1ead6" />
      <circle cx="3.8" cy="-2" r=".9" fill="#f1ead6" />
      <circle cx="-.4" cy="-1.6" r=".6" fill="#f1ead6" />
    </>
  ),
  // kantarelli - chanterelles, two little golden funnels
  chanterelle: () => (
    <>
      {shade(7, 2, 4)}
      {[
        [-3, 1, 1],
        [3.4, 2, 0.8],
      ].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <path d="M-1 4q-.4-3 .1-5h1.8q.5 2 .1 5z" fill="#c8902c" />
          <path d="M-4.5-1Q-4-4.5 0-4.6Q4-4.5 4.5-1Q2 0 0-.2Q-2 0-4.5-1Z" fill="#e0a83a" />
          <path d="M-3-2.6q3-1.6 6 0" stroke="#f4cf6a" strokeWidth=".6" fill="none" />
        </g>
      ))}
    </>
  ),
  pebbles: ({ c }) => (
    <>
      {shade(10, 3, 3)}
      <ellipse cx="-3" cy="0" rx="5.2" ry="3.8" fill="#5f5b54" />
      <ellipse cx="-3.6" cy="-1.2" rx="3.4" ry="2" fill="#7a756c" />
      <ellipse cx="4" cy="1.6" rx="3.4" ry="2.6" fill="#55514a" />
      <ellipse cx="3.6" cy=".9" rx="2" ry="1.2" fill="#726d64" />
      <path d="M-6.5-1.6q2-2.6 5-2.4q-2.6 1-3.6 2.8z" fill={pickOne(c.r1, c.moss)} />
    </>
  ),
  // saniainen - a fern sprig
  fern: ({ c }) => {
    const g = pickOne(c.r1, c.moss)
    return (
      <>
        <path d="M0 9Q1 0-2-9" stroke={g} strokeWidth=".9" fill="none" />
        {[-6, -3, 0, 3, 6].map((y, i) => (
          <g key={y}>
            <path d={`M${-0.3 - y * 0.15} ${y}q-3-1.4-${5 - i * 0.5}-0.4`} stroke={g} strokeWidth="1.6" strokeLinecap="round" fill="none" />
            <path d={`M${-0.3 - y * 0.15} ${y}q3-1.8 ${5 - i * 0.5}-1.2`} stroke={g} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </g>
        ))}
      </>
    )
  },
  twig: () => (
    <>
      <path d="M-9 3Q-2 1 9-2" stroke="#000" strokeOpacity=".3" strokeWidth="2.6" fill="none" strokeLinecap="round" transform="translate(0 1.4)" />
      <path d="M-9 3Q-2 1 9-2M-1 1.6l-2.6-4M4 .2l2.2 3" stroke="#5a3e24" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M-8 2.4Q-2 .6 8-2.4" stroke="#7d5a36" strokeWidth=".5" fill="none" />
    </>
  ),
  // puolukka - a lingonberry sprig
  berries: () => (
    <>
      {[
        [-4, -1, -30],
        [3.6, -2.4, 40],
        [-1, -5, -5],
        [4.4, 2.6, 80],
      ].map(([x, y, r]) => (
        <ellipse key={`${x}${y}`} cx={x} cy={y} rx="1.6" ry="2.8" transform={`rotate(${r} ${x} ${y})`} fill="#2f4a22" stroke="#1c2c14" strokeWidth=".4" />
      ))}
      <circle cx="-1" cy="1.6" r="1.7" fill="#b3262b" />
      <circle cx="1.8" cy="2.6" r="1.5" fill="#c4342f" />
      <circle cx=".4" cy="-.6" r="1.4" fill="#9e1f26" />
      <circle cx="-1.5" cy="1" r=".5" fill="#fff" opacity=".5" />
    </>
  ),
  // käpy - a spruce cone
  cone: () => (
    <>
      {shade(5, 2, 4)}
      <ellipse cx="0" cy="0" rx="3.4" ry="6.2" fill="#6a4426" />
      {[-4, -1.5, 1, 3.5].map((y) => (
        <path key={y} d={`M-3 ${y}q3 1.6 6 0`} stroke="#3d2614" strokeWidth=".7" fill="none" />
      ))}
      <path d="M-1.6-4.6q1.6-1.6 3 0" stroke="#9a6a3c" strokeWidth=".6" fill="none" />
    </>
  ),
  mosstuft: ({ c }) => (
    <>
      <circle cx="-3" cy="1" r="3.6" fill={c.moss[2] || c.moss[0]} />
      <circle cx="2.6" cy="0" r="4.2" fill={pickOne(c.r1, c.moss)} />
      <circle cx="0" cy="-2.4" r="3" fill={pickOne(c.r2, c.moss)} />
      <circle cx="1.6" cy="-3" r="1" fill="#9fc068" opacity=".5" />
      <circle cx="-2.6" cy="-.6" r=".8" fill="#9fc068" opacity=".4" />
    </>
  ),
  // ---- biome details (Mirefall, Wounded Grove, Frostroot, Sunspire, Echo) ----
  // kaislat - reeds with cattail heads
  reeds: () => (
    <>
      {shade(6, 2, 7)}
      {[-3.5, 0, 3.5].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 7Q${x + (i - 1) * 1.5} -1 ${x + (i - 1) * 2} -8`} stroke="#4a6a3a" strokeWidth="1.1" fill="none" strokeLinecap="round" />
          {i !== 1 && <ellipse cx={x + (i - 1) * 2} cy={-6} rx="1.3" ry="3" fill="#5a3a22" />}
        </g>
      ))}
    </>
  ),
  // lumme - a lily pad with a pale flower
  lily: ({ c }) => (
    <>
      <path d="M0 0L7 -2A7.2 5 0 1 1 6.6 1.6Z" fill="#3c6a44" stroke="#24452c" strokeWidth=".6" />
      <path d="M-4 0q4-2 8 0" stroke="#5a8a5a" strokeWidth=".5" fill="none" />
      {c.r1() > 0.5 && (
        <g transform="translate(-2 -1)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-1.6" rx="1" ry="1.8" fill={pickOne(c.r2, c.flower)} transform={`rotate(${a})`} />
          ))}
          <circle r=".8" fill="#e2c25a" />
        </g>
      )}
    </>
  ),
  // a dead grey twig
  deadtwig: () => (
    <>
      <path d="M-9 3Q-2 1 9-2M-1 1.6l-2.6-4M4 .2l2.2 3M-5 2.4l-1 3" stroke="#6e6a62" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M-8 2.4Q-2 .6 8-2.4" stroke="#9a958a" strokeWidth=".4" fill="none" />
    </>
  ),
  // tuhka - ash specks
  ash: () => (
    <g fill="#7a756c">
      <ellipse cx="0" cy="0" rx="6" ry="3" opacity=".35" />
      <circle cx="-3" cy="0" r="1.2" opacity=".7" />
      <circle cx="2" cy="-1" r="1" opacity=".6" />
      <circle cx="4" cy="1.4" r=".8" fill="#a39a8e" opacity=".7" />
      <circle cx="-1" cy="1.8" r=".7" fill="#4a4640" />
    </g>
  ),
  // hiillos - a few coals still glowing
  ember: () => (
    <>
      <ellipse cx="0" cy="1" rx="5" ry="2.2" fill="#2a1c14" />
      <circle cx="-2" cy="0" r="1.4" fill="#e0661c" />
      <circle cx="1.6" cy=".6" r="1.1" fill="#ff9a3a" />
      <circle cx="0" cy="-1" r=".7" fill="#ffd27a" />
      <circle cx="0" cy="0" r="4.5" fill="#ff7a2a" opacity=".18" />
    </>
  ),
  // lumikinos - a snow patch
  snowtuft: () => (
    <>
      <ellipse cx="0" cy="1.2" rx="8" ry="3.6" fill="#9fb0bc" opacity=".55" />
      <ellipse cx="-2" cy="0" rx="6" ry="3" fill="#e8f0f5" />
      <ellipse cx="3" cy="0.6" rx="4" ry="2.4" fill="#f4f9fc" />
      <ellipse cx="-3" cy="-.8" rx="2.4" ry="1" fill="#ffffff" opacity=".8" />
    </>
  ),
  // jääkide - a small ice crystal cluster
  icecrystal: () => (
    <>
      {shade(5, 1.6, 4)}
      <path d="M0 4L-2-6 0-9 2-6Z" fill="#cfeefa" stroke="#7fb8d0" strokeWidth=".5" />
      <path d="M-1 4L-6-2 -6-5 -3-1Z" fill="#a8d8ec" stroke="#7fb8d0" strokeWidth=".5" />
      <path d="M1 4L5-3 6-1 3 3Z" fill="#b8e2f2" stroke="#7fb8d0" strokeWidth=".5" />
      <path d="M0-8L0.6-6" stroke="#ffffff" strokeWidth=".6" />
    </>
  ),
  // a violet crystal shard (Echo)
  shard: () => (
    <>
      <ellipse cx="0" cy="3" rx="5" ry="1.6" fill="#000" opacity=".3" />
      <ellipse cx="0" cy="-1" rx="7" ry="6" fill="#9a7ae8" opacity=".14" />
      <path d="M-1 4L-3-5 0-9 2-4Z" fill="#a88af0" stroke="#5a3e9a" strokeWidth=".5" />
      <path d="M1 4L4-2 6 0 3 4Z" fill="#7fc8e8" stroke="#3e6a9a" strokeWidth=".5" />
      <path d="M-2-4L-.6-8" stroke="#efe6ff" strokeWidth=".6" />
    </>
  ),
  // glowing motes hovering just above the ground
  glowmote: ({ c }) => {
    const col = pickOne(c.r1, c.flower)
    return (
      <>
        <circle cx="-3" cy="0" r="3.6" fill={col} opacity=".16" />
        <circle cx="-3" cy="0" r="1.2" fill={col} />
        <circle cx="3" cy="-3" r="2.6" fill={col} opacity=".14" />
        <circle cx="3" cy="-3" r=".9" fill={col} />
      </>
    )
  },
}
// A soft ground patch (moss or copper leaf litter) - irregular, feathered.
function Patch({ d }) {
  return (
    <g transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) rotate(${d.rot}) scale(${d.scale.toFixed(2)})`} data-detail="patch" fill={d.colour}>
      <ellipse cx="0" cy="0" rx="20" ry="11" opacity=".22" />
      <ellipse cx={-4 + d.tone * 8} cy={-1} rx="13" ry="7.5" opacity=".28" />
      <ellipse cx={6 - d.tone2 * 10} cy={2} rx="8" ry="5" opacity=".3" />
    </g>
  )
}

// Things that stand or lie flat on the ground keep upright (only a small
// tilt) - snow, mushrooms, reeds, crystals; loose things (leaves, twigs,
// cones) may lie any way round.
const UPRIGHT = new Set(["toadstool", "chanterelle", "reeds", "icecrystal", "shard", "snowtuft", "ember", "glowmote", "lily", "ash", "pebbles", "mosstuft", "berries"])

function Detail({ d, colours }) {
  const Art = DETAIL_ART[d.kind]
  if (!Art) return null
  const c = { ...colours, r1: () => d.tone, r2: () => d.tone2 }
  const rot = UPRIGHT.has(d.kind) ? (d.rot % 16) - 8 : d.rot
  return (
    <g transform={`translate(${d.x.toFixed(1)} ${d.y.toFixed(1)}) rotate(${rot}) scale(${d.scale.toFixed(2)})`} data-detail={d.kind}>
      <Art c={c} />
    </g>
  )
}

// --- raised ground: high ground tiles become rounded mounds -----------------------
// Plan: docs/hearthwood-battlefield-plan.md (Marc: "high ground rumasti...
// kumpuja", "3D-mäinen mutta 2D", "korkeuserot"). Each high tile is a round
// hump; neighbouring humps are bridged, so a group of tiles reads as one
// lumpy hill. Height = the classic 2.5D extrusion: the same silhouette drawn
// lower in earth colours shows as the hill's south face, with a soft shadow
// beyond it. The top is lit from the top-left (like the sun shafts) and
// darkens down its slopes. Colours: biome.palette.hill. Drawn under the
// cells - units, highlights and telegraphs stay on top.
export const HILL_HEIGHT = 14 // px of visible earth face = how high it reads

// Joined high tiles = one hill (4-neighbour components).
function hillComponents(tiles, isHigh) {
  const seen = new Set()
  const out = []
  for (const [r0, c0] of tiles) {
    if (seen.has(`${r0}-${c0}`)) continue
    const comp = []
    const q = [[r0, c0]]
    seen.add(`${r0}-${c0}`)
    while (q.length) {
      const [r, c] = q.shift()
      comp.push([r, c])
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const k = `${r + dr}-${c + dc}`
        if (!seen.has(k) && isHigh(r + dr, c + dc)) {
          seen.add(k)
          q.push([r + dr, c + dc])
        }
      }
    }
    out.push(comp)
  }
  return out
}

// The silhouette of one hill: a hump per tile + bridges to high neighbours.
// Flat list of shapes (a <clipPath> ignores <g> children).
function HillShape({ comp, isHigh }) {
  const parts = []
  for (const [r, c] of comp) {
    const cx = PAD + c * STEP + CELL / 2
    const cy = PAD + r * STEP + CELL / 2 - HILL_HEIGHT / 2
    const wob = (hashString(`${r}-${c}-hump`) % 100) / 100
    parts.push(<ellipse key={`e${r}-${c}`} cx={cx} cy={cy} rx={CELL * (0.5 + wob * 0.04)} ry={CELL * (0.46 + wob * 0.03)} />)
    if (isHigh(r, c + 1)) parts.push(<rect key={`h${r}-${c}`} x={cx} y={cy - CELL * 0.43} width={STEP} height={CELL * 0.86} />)
    if (isHigh(r + 1, c)) parts.push(<rect key={`v${r}-${c}`} x={cx - CELL * 0.47} y={cy} width={CELL * 0.94} height={STEP} />)
    if (isHigh(r, c + 1) && isHigh(r + 1, c) && isHigh(r + 1, c + 1)) parts.push(<rect key={`q${r}-${c}`} x={cx} y={cy} width={STEP} height={STEP} />)
  }
  return parts
}

function HillLayer({ terrain, grid, hill }) {
  const isHigh = (r, c) => terrain?.[`${r}-${c}`] === "high"
  const tiles = []
  for (let r = 0; r < grid.rows; r++) for (let c = 0; c < grid.cols; c++) if (isHigh(r, c)) tiles.push([r, c])
  if (!tiles.length || !hill) return null
  const comps = hillComponents(tiles, isHigh)
  return (
    <g className="hwt-forest-hills" data-hills={tiles.length}>
      {comps.map((comp, ci) => {
        const xs = comp.map(([, c]) => PAD + c * STEP)
        const ys = comp.map(([r]) => PAD + r * STEP)
        const bx = Math.min(...xs) - 6
        const by = Math.min(...ys) - HILL_HEIGHT - 6
        const bw = Math.max(...xs) + CELL - bx + 12
        const bh = Math.max(...ys) + CELL - by + HILL_HEIGHT + 12
        const id = `hwt-hill-${ci}`
        return (
          <g key={id} data-hill-group={comp.length}>
            <defs>
              <clipPath id={`${id}-top`}>
                <HillShape comp={comp} isHigh={isHigh} />
              </clipPath>
              <radialGradient id={`${id}-dome`} gradientUnits="userSpaceOnUse" cx={bx + bw * 0.4} cy={by + bh * 0.34} r={Math.max(bw, bh) * 0.6}>
                <stop offset="0" stopColor={hill.lit} stopOpacity=".5" />
                <stop offset=".5" stopColor={hill.top[0]} stopOpacity="0" />
                <stop offset="1" stopColor={hill.shade} stopOpacity=".7" />
              </radialGradient>
              <linearGradient id={`${id}-face`} gradientUnits="userSpaceOnUse" x1="0" y1={by} x2="0" y2={by + bh}>
                <stop offset="0" stopColor={hill.cliff[0]} />
                <stop offset="1" stopColor={hill.cliff[1]} />
              </linearGradient>
            </defs>
            {/* shadow on the floor, then the earth face, then the lit top */}
            <g transform={`translate(8 ${HILL_HEIGHT + 7})`} fill="#000" opacity=".3">
              <HillShape comp={comp} isHigh={isHigh} />
            </g>
            <g transform={`translate(0 ${HILL_HEIGHT})`} fill={`url(#${id}-face)`}>
              <HillShape comp={comp} isHigh={isHigh} />
            </g>
            <g transform={`translate(0 ${HILL_HEIGHT})`} fill="none" stroke={hill.strata} strokeWidth="1" opacity=".5" clipPath={`url(#${id}-top)`}>
              <HillShape comp={comp} isHigh={isHigh} />
            </g>
            <g clipPath={`url(#${id}-top)`}>
              <rect x={bx} y={by} width={bw} height={bh} fill={hill.top[1]} />
              <rect x={bx} y={by} width={bw} height={bh} fill={`url(#${id}-dome)`} />
            </g>
            {/* lit lip along the top edge's south rim (where top meets face) */}
            {comp.map(([r, c]) => {
              const x = PAD + c * STEP
              const y = PAD + r * STEP - HILL_HEIGHT / 2
              const rnd = (n) => (hashString(`${r}-${c}-${n}`) % 1000) / 1000
              return (
                <g key={`d${r}-${c}`} data-hill={`${r}-${c}`}>
                  {[0, 1, 2].map((i) => {
                    const tx = x + 18 + rnd(i + 10) * (CELL - 36)
                    const ty = y + 18 + rnd(i + 20) * (CELL - 36)
                    return <path key={i} d={`M${tx} ${ty}l-2-6M${tx} ${ty}l1-7M${tx} ${ty}l3-5`} stroke={hill.lit} strokeWidth="1.2" opacity=".6" strokeLinecap="round" />
                  })}
                  {rnd(30) > 0.5 && <ellipse cx={x + 22 + rnd(31) * 32} cy={y + 22 + rnd(32) * 22} rx="4" ry="2.8" fill="#77726a" stroke="#3d3a33" strokeWidth=".6" />}
                  {!isHigh(r + 1, c) &&
                    [0.3, 0.62].map((f, i) => (
                      <path key={f} d={`M${x + CELL * f} ${y + CELL * 0.9 + 2}q${rnd(i) * 4 - 2} 5 ${rnd(i + 3) * 3 - 1} ${6 + rnd(i + 6) * 4}`} stroke="#2b1c0f" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".8" />
                    ))}
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

// --- the frame: old roots creeping in from the four corners -------------------
// Drawn for the top-left corner, mirrored to the others.
const ROOTS = [
  { d: "M-6 18C24 24 50 10 84 26C104 35 120 28 150 40", w: 15 },
  { d: "M18-6C24 26 10 56 26 92C33 110 26 124 38 154", w: 13 },
  { d: "M0 2C26 30 40 42 64 58C76 66 82 76 98 84", w: 8 },
  { d: "M84 26C92 16 104 14 114 4", w: 5 },
  { d: "M26 92C16 100 14 112 4 120", w: 5 },
  { d: "M64 58C66 70 62 82 67 94", w: 3.6 },
  { d: "M118 31C126 40 136 44 148 56", w: 3 },
  { d: "M150 40C162 44 170 42 182 48", w: 2.4 },
  { d: "M38 154C40 166 38 174 44 186", w: 2.4 },
]
const MOSS_PATCHES = [
  [44, 15, 10, 5],
  [20, 50, 5, 10],
  [72, 61, 7, 4],
  [106, 32, 7, 3.6],
  [8, 10, 9, 8],
]
function CornerRoots({ transform }) {
  return (
    <g transform={transform}>
      {ROOTS.map((r) => (
        <path key={`o${r.d}`} d={r.d} stroke="#120d08" strokeWidth={r.w + 2.4} fill="none" strokeLinecap="round" opacity=".8" />
      ))}
      {ROOTS.map((r) => (
        <path key={`b${r.d}`} d={r.d} stroke="#3a2a1b" strokeWidth={r.w} fill="none" strokeLinecap="round" />
      ))}
      {ROOTS.map((r) => (
        <path key={`h${r.d}`} d={r.d} stroke="#5e4329" strokeWidth={Math.max(0.6, r.w * 0.3)} fill="none" strokeLinecap="round" transform="translate(-.8 -1.2)" opacity=".85" />
      ))}
      {MOSS_PATCHES.map(([x, y, rx, ry]) => (
        <g key={`${x}-${y}`}>
          <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#4f6b2e" opacity=".9" />
          <ellipse cx={x - rx * 0.25} cy={y - ry * 0.3} rx={rx * 0.5} ry={ry * 0.45} fill="#7a9a4a" opacity=".6" />
        </g>
      ))}
    </g>
  )
}

function ForestFloorImpl({ biome, grid, terrain, salt }) {
  const w = PAD * 2 + grid.cols * CELL + (grid.cols - 1) * GAP
  const h = PAD * 2 + grid.rows * CELL + (grid.rows - 1) * GAP
  const details = useMemo(() => floorDetailLayout(biome, grid, terrain, salt), [biome, grid, terrain, salt])
  const colours = biome.detail.colours
  return (
    <svg className="hwt-forest-floor" data-biome={biome.id} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className="hwt-forest-roots">
        <CornerRoots transform="" />
        <CornerRoots transform={`translate(${w} 0) scale(-1 1)`} />
        <CornerRoots transform={`translate(0 ${h}) scale(1 -1)`} />
        <CornerRoots transform={`translate(${w} ${h}) scale(-1 -1)`} />
      </g>
      <g className="hwt-forest-patches">
        {details
          .filter((d) => d.kind === "patch")
          .map((d) => (
            <Patch key={d.key} d={d} />
          ))}
      </g>
      <HillLayer terrain={terrain} grid={grid} hill={biome.palette?.hill} />
      <g className="hwt-forest-details">
        {details
          .filter((d) => d.kind !== "patch")
          .map((d) => (
            <Detail key={d.key} d={d} colours={colours} />
          ))}
      </g>
    </svg>
  )
}
export const ForestFloor = memo(ForestFloorImpl)
