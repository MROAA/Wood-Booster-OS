// Hearthwood Frontier - terrain & object tile art (inline SVG, no raster assets).
//
// Terrain: one small SVG per type, served as a data-URI background so it slots
// into the cell's existing background stack (`--hwt-tile-pattern`) - every zone
// tint / move ring / telegraph keeps painting ON TOP of it with zero changes.
// Each type has an animated and a still version (reduced motion picks still).
// Objects (tree, barrel, spore pod, boulder, ice pillar): inline JSX SVG sprites.
// Pure presentation - no game rules here.
import { OBJECTS } from "../../services/heartwood/tacticsObjects"

const svg = (body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" preserveAspectRatio="none">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`
const anim = (on, s) => (on ? s : "")
const loop = (attr, values, dur, begin = "0s") =>
  `<animate attributeName="${attr}" values="${values}" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>`

// Shared ground plates (muted, dark - the tavern board).
const EARTH = `<rect width="64" height="64" fill="#29231b"/><circle cx="14" cy="18" r="1.4" fill="#3a3127"/><circle cx="46" cy="12" r="1" fill="#3a3127"/><circle cx="52" cy="46" r="1.3" fill="#1d1812"/><circle cx="20" cy="50" r="1" fill="#3a3127"/>`
const MOSS = `<rect width="64" height="64" fill="#1f2818"/><circle cx="12" cy="14" r="5" fill="#263220"/><circle cx="50" cy="20" r="6" fill="#243019"/><circle cx="24" cy="50" r="7" fill="#243019"/><circle cx="54" cy="52" r="3" fill="#2a3722"/>`
const FROST = `<rect width="64" height="64" fill="#26323a"/><circle cx="16" cy="20" r="6" fill="#2e3d46"/><circle cx="48" cy="46" r="8" fill="#2c3a43"/>`

const WAVE = (y) => `<path d="M-16 ${y}q4-3 8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0t8 0"/>`
const waterBase = (a, glints = true) =>
  `<rect width="64" height="64" fill="url(#w)"/>` +
  `<g fill="none" stroke="#8cc3d3" stroke-linecap="round" stroke-width="1.5" opacity=".45">${WAVE(14)}${WAVE(32)}${WAVE(50)}` +
  anim(a, `<animateTransform attributeName="transform" type="translate" values="0 0;8 1;0 0" dur="6s" repeatCount="indefinite"/>`) +
  `</g><g fill="none" stroke="#5f97aa" stroke-linecap="round" stroke-width="1" opacity=".35" transform="translate(8 0)">${WAVE(23)}${WAVE(41)}` +
  anim(a, `<animateTransform attributeName="transform" type="translate" values="8 0;0 -1;8 0" dur="7s" repeatCount="indefinite"/>`) +
  `</g>` +
  (glints
    ? `<ellipse cx="20" cy="27" rx="4" ry="1" fill="#d6f0f7" opacity=".3">${anim(a, loop("opacity", ".08;.5;.08", "3.6s"))}</ellipse>` +
      `<ellipse cx="45" cy="45" rx="3" ry=".9" fill="#d6f0f7" opacity=".3">${anim(a, loop("opacity", ".08;.45;.08", "4.2s", "1.8s"))}</ellipse>`
    : "")
const WATER_DEFS = `<linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20485a"/><stop offset="1" stop-color="#132a36"/></linearGradient>`

const tuft = (x, y, h, c) =>
  `<path d="M${x} ${y}q-2 ${-h / 2} -6 ${-h}M${x} ${y}q-1 ${-h / 2} -1 ${-h - 2}M${x} ${y}q1 ${-h / 2} 3 ${-h}M${x} ${y}q3 ${-h / 2} 7 ${-h + 3}" stroke="${c}"/>`

const flame = (x, y, s, dur, begin) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g>` +
  `<path d="M0 0C-11 0-12-12-5-22C-5-15 1-15-1-28C9-19 11-8 10-4C9 0 5 0 0 0Z" fill="#d9531c"/>` +
  `<path d="M0 0C-6 0-7-7-3-13C-2-9 2-9 1-17C6-11 7-5 6-3C5 0 3 0 0 0Z" fill="#f29a2e"/>` +
  `<path d="M0 0C-3 0-3-4-1-7C0-5 2-5 2-8C4-5 4-2 3-1C2 0 1 0 0 0Z" fill="#ffd98a"/>` +
  `%ANIM%</g></g>`.replace("%ANIM%", dur ? `<animateTransform attributeName="transform" type="scale" values="1 1;.9 1.12;1.04 .94;1 1" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>` : "")

// type -> (animated) => svg string
const TERRAIN_SVG = {
  water: (a) => svg(waterBase(a), WATER_DEFS),
  bridge: () =>
    svg(
      waterBase(false, false) +
        `<rect x="0" y="54" width="64" height="4" fill="#000" opacity=".35"/>` +
        [0, 8, 16, 24, 32, 40, 48, 56].map((x, i) => `<rect x="${x + 0.5}" y="9" width="7" height="45" rx="1" fill="${i % 2 ? "#6d4829" : "#7c5431"}"/><path d="M${x + 3} 14v10M${x + 5} 30v14" stroke="#553619" stroke-width=".8"/>`).join("") +
        `<rect x="0" y="8" width="64" height="4" fill="#4a2f1a"/><rect x="0" y="51" width="64" height="4" fill="#4a2f1a"/>` +
        `<g fill="#2a1a10">${[4, 20, 36, 52].map((x) => `<circle cx="${x}" cy="15" r=".9"/><circle cx="${x}" cy="48" r=".9"/>`).join("")}</g>` +
        `<rect x="0" y="8" width="64" height="1" fill="#a07448" opacity=".6"/>`,
      WATER_DEFS,
    ),
  lava: (a) =>
    svg(
      `<rect width="64" height="64" fill="#2a170f"/>` +
        `<g fill="#3a2217"><path d="M3 3h22l-3 15-19 3z"/><path d="M33 2h28v12l-15 8-13-5z"/><path d="M4 30l13-3 8 12-5 21H4z"/><path d="M30 24l13 5 5 14-13 5-7-10z"/><path d="M53 22l9-4v28l-9 3-3-12z"/><path d="M26 54l12-3 9 9v4H24z"/></g>` +
        `<g fill="none" stroke-linecap="round" stroke-linejoin="round">` +
        `<g stroke="#ff5a14" stroke-width="5" opacity=".35">%P%</g><g stroke="#ff8a2a" stroke-width="2">%P%</g><g stroke="#ffd27a" stroke-width=".8">%P%</g>`.replaceAll(
          "%P%",
          `<path d="M0 25L17 23 27 18 44 26 53 21 64 17M27 18L31 2M44 26L49 44 60 48 64 47M17 23L22 40 18 64M22 40L35 49 39 64M49 44L36 49"/>`,
        ) +
        anim(a, loop("opacity", ".65;1;.65", "3.2s")) +
        `</g><circle cx="27" cy="18" r="2" fill="#ffe29a" opacity=".85"/><circle cx="44" cy="26" r="1.6" fill="#ffe29a" opacity=".7"/><circle cx="22" cy="40" r="1.6" fill="#ffe29a" opacity=".7"/>`,
    ),
  poison: (a) =>
    svg(
      EARTH +
        `<path d="M8 32C6 18 22 9 35 12C50 14 59 25 55 38C52 51 38 57 25 53C13 50 9 43 8 32Z" fill="#2d4714"/>` +
        `<path d="M11 32C10 21 23 13 35 15C47 17 55 26 52 37C49 48 37 53 26 50C16 47 12 41 11 32Z" fill="#4f7d22"/>` +
        `<path d="M18 30C18 22 28 18 36 20C45 22 49 28 46 36C43 44 33 46 27 44C21 42 18 37 18 30Z" fill="#6d9c2e" opacity=".8"/>` +
        `<path d="M20 24q8-7 18-5" stroke="#d9f59a" stroke-width="1.2" fill="none" opacity=".35" stroke-linecap="round"/>` +
        `<g fill="#9cc84a" stroke="#d4f28a" stroke-width=".8">` +
        `<circle cx="26" cy="34" r="2.6">${anim(a, loop("r", "1;3;1", "2.6s") + loop("opacity", "0;1;0", "2.6s"))}</circle>` +
        `<circle cx="40" cy="29" r="2">${anim(a, loop("r", "1;2.4;1", "3.1s", ".9s") + loop("opacity", "0;1;0", "3.1s", ".9s"))}</circle>` +
        `<circle cx="36" cy="42" r="1.6">${anim(a, loop("r", ".6;2;.6", "2.2s", "1.6s") + loop("opacity", "0;1;0", "2.2s", "1.6s"))}</circle>` +
        `</g>`,
    ),
  bush: () =>
    svg(
      `<rect width="64" height="64" fill="#1c2615"/>` +
        `<g fill="none" stroke-width="1.8" stroke-linecap="round">` +
        [[12, 22, 12], [34, 18, 13], [55, 24, 12], [22, 38, 14], [46, 40, 14], [8, 56, 13], [32, 58, 15], [56, 60, 13]]
          .map(([x, y, h], i) => tuft(x, y, h, "#2c4419") + tuft(x + 3, y + 1, h - 2, i % 2 ? "#4f7430" : "#5a8036"))
          .join("") +
        `</g><g fill="#a8c860" opacity=".4"><circle cx="31" cy="4" r="1"/><circle cx="52" cy="26" r="1"/></g>`,
    ),
  ice: (a) =>
    svg(
      `<rect width="64" height="64" fill="url(#i)"/>` +
        `<path d="M0 40L40 0H50L0 50Z" fill="#fff" opacity=".18">${anim(a, loop("opacity", ".1;.28;.1", "4.5s"))}</path>` +
        `<path d="M22 64L64 22V28L28 64Z" fill="#fff" opacity=".1"/>` +
        `<g fill="none" stroke="#eaf8ff" stroke-width=".9" opacity=".75" stroke-linecap="round"><path d="M6 52L20 40 29 42 42 27 57 22"/><path d="M20 40L18 28 24 20"/><path d="M29 42L35 57"/><path d="M42 27L44 12"/></g>` +
        `<rect x="1" y="1" width="62" height="62" rx="4" fill="none" stroke="#dff3fb" stroke-width="1.5" opacity=".3"/>`,
      `<linearGradient id="i" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8db4c7"/><stop offset="1" stop-color="#4a6e80"/></linearGradient>`,
    ),
  high: () =>
    svg(
      `<rect width="64" height="44" fill="url(#h)"/>` +
        `<g fill="none" stroke="#f0d9a8" opacity=".22"><ellipse cx="32" cy="22" rx="22" ry="13"/><ellipse cx="32" cy="22" rx="12" ry="6"/></g>` +
        `<g stroke="#6f8d3a" stroke-width="1.4" stroke-linecap="round" opacity=".8"><path d="M8 10l-1-4M9 10l1-4M52 34l-1-4M53 34l1-4M46 8l-1-3M47 8l1-3"/></g>` +
        `<rect y="44" width="64" height="20" fill="#4a3320"/>` +
        `<g stroke="#2e1f13" stroke-width="1.2"><path d="M0 51h64M0 58h64"/><path d="M12 44v7M30 51v7M46 44v7M20 58v6M54 58v6M5 51v7" /></g>` +
        `<rect y="60" width="64" height="4" fill="#1b120b" opacity=".7"/>` +
        `<rect y="42.5" width="64" height="2.5" fill="#f0d9a8" opacity=".8"/>` +
        `<rect y="0" width="64" height="1.5" fill="#f0d9a8" opacity=".35"/>` +
        `<path d="M32 16l6 7h-4v6h-4v-6h-4z" fill="#f0d9a8" opacity=".38"/>`,
      `<linearGradient id="h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a88455"/><stop offset="1" stop-color="#836340"/></linearGradient>`,
    ),
  rock: () =>
    svg(
      EARTH +
        `<g fill="#15130f" opacity=".6"><ellipse cx="23" cy="47" rx="16" ry="5"/><ellipse cx="46" cy="32" rx="12" ry="4"/><ellipse cx="47" cy="55" rx="8" ry="3"/></g>` +
        `<path d="M8 44C6 32 14 24 24 24C34 23 40 32 38 43C36 49 14 50 8 44Z" fill="#6b655b"/>` +
        `<path d="M8 44C14 50 36 49 38 43C36 47 30 44 24 44C16 44 12 42 8 44Z" fill="#48433c"/>` +
        `<path d="M13 32C16 27 23 26 27 28C21 29 17 31 13 34Z" fill="#9a9385" opacity=".7"/>` +
        `<path d="M34 29C33 20 40 14 47 15C55 16 59 23 56 30C53 34 38 35 34 29Z" fill="#7a7468"/>` +
        `<path d="M38 20C41 16 47 16 50 17C45 18 41 20 38 23Z" fill="#a8a193" opacity=".7"/>` +
        `<path d="M40 52C39 46 44 43 48 43C53 43 56 47 54 52C51 55 42 55 40 52Z" fill="#5f5a51"/>` +
        `<path d="M22 30l3 7-2 5M46 20l-2 6" stroke="#2c2924" stroke-width="1" fill="none"/>`,
    ),
  forest: () =>
    svg(
      MOSS +
        `<g fill="#15200f" opacity=".6"><ellipse cx="16" cy="30" rx="9" ry="2.5"/><ellipse cx="46" cy="56" rx="10" ry="2.5"/></g>` +
        `<rect x="15" y="22" width="2.4" height="8" fill="#4a3220"/><path d="M16 4L25 16H20L27 25H5L12 16H7Z" fill="#3a5a26"/><path d="M16 4L20 9.5 16 11Z" fill="#557a37"/>` +
        `<rect x="45" y="46" width="2.6" height="10" fill="#4a3220"/><path d="M46 24L56 38H50L58 48H34L42 38H36Z" fill="#35532a"/><path d="M46 24L51 31 46 33Z" fill="#557a37"/>` +
        `<g fill="none" stroke="#4d6d30" stroke-width="1.3" stroke-linecap="round"><path d="M30 44q2-5 7-6M33 44q0-4 3-7M52 12q-3 2-3 6M8 52q4-3 8-2"/></g>` +
        `<g fill="#6d8c3a" opacity=".6"><circle cx="30" cy="16" r="1"/><circle cx="24" cy="58" r="1"/></g>`,
    ),
  wall: () =>
    svg(
      EARTH +
        `<rect x="0" y="56" width="64" height="8" fill="#000" opacity=".3"/>` +
        [1, 14, 27, 40, 53]
          .map((x) => `<path d="M${x} 16L${x + 5} 4 ${x + 10} 16V60H${x}Z" fill="#7a4e2a"/><path d="M${x} 16L${x + 5} 4V60H${x}Z" fill="#94603a"/><path d="M${x + 8} 14V60H${x + 10}V16Z" fill="#4e2f18"/><path d="M${x + 5} 4L${x + 7} 9" stroke="#c4935e" stroke-width=".8"/>`)
          .join("") +
        `<g fill="#3a2414"><rect y="24" width="64" height="3.5"/><rect y="42" width="64" height="3.5"/></g>` +
        `<g stroke="#9c7a4c" stroke-width=".8"><path d="M3 24l2 3.5M16 24l2 3.5M29 24l2 3.5M42 24l2 3.5M55 24l2 3.5M3 42l2 3.5M16 42l2 3.5M29 42l2 3.5M42 42l2 3.5M55 42l2 3.5"/></g>`,
    ),
  rubble: () =>
    svg(
      EARTH +
        `<g transform="rotate(-18 22 30)"><rect x="8" y="27" width="26" height="5" rx="1" fill="#6d4829"/><path d="M34 27l4 2-4 3z" fill="#6d4829"/></g>` +
        `<g transform="rotate(24 44 44)"><rect x="34" y="42" width="20" height="4" rx="1" fill="#7c5431"/></g>` +
        `<g fill="#6b655b"><path d="M10 48l6-4 6 3-2 6-8 1z"/><path d="M40 16l5-3 5 3-2 5-6 0z"/><path d="M26 52l4-2 3 3-3 3z"/></g>` +
        `<g fill="#8d877c" opacity=".7"><path d="M10 48l6-4 2 1-7 4z"/><path d="M40 16l5-3 1 1-5 3z"/></g>`,
    ),
  log: () =>
    svg(
      MOSS +
        `<ellipse cx="32" cy="46" rx="28" ry="4" fill="#0f150a" opacity=".6"/>` +
        `<rect x="4" y="24" width="48" height="20" rx="6" fill="#6e4526"/>` +
        `<rect x="4" y="24" width="48" height="5" rx="2.5" fill="#8a5a34"/>` +
        `<g stroke="#46290f" stroke-width="1.1" fill="none" stroke-linecap="round"><path d="M8 33h14M26 36h18M12 40h10M30 30h12"/></g>` +
        `<path d="M20 24l-4-7 3-1 4 8z" fill="#5d3a1f"/>` +
        `<ellipse cx="52" cy="34" rx="7" ry="10" fill="#c09058"/><ellipse cx="52" cy="34" rx="4.5" ry="6.5" fill="none" stroke="#8a5e34" stroke-width="1"/><ellipse cx="52" cy="34" rx="2" ry="3" fill="none" stroke="#8a5e34" stroke-width="1"/>`,
    ),
  stump: () =>
    svg(
      MOSS +
        `<ellipse cx="32" cy="44" rx="20" ry="5" fill="#0f150a" opacity=".6"/>` +
        `<g stroke="#5a3a20" stroke-width="3" stroke-linecap="round" fill="none"><path d="M16 40q-6 2-9 7M48 40q6 2 9 6M26 44q-2 5-6 8"/></g>` +
        `<path d="M16 30V40Q32 48 48 40V30Z" fill="#5a3a20"/><path d="M20 32v9M28 34v10M38 34v10M44 32v8" stroke="#3e2714" stroke-width="1"/>` +
        `<ellipse cx="32" cy="30" rx="16" ry="7" fill="#c09058"/>` +
        `<g fill="none" stroke="#8a5e34" stroke-width="1"><ellipse cx="32" cy="30" rx="11" ry="4.6"/><ellipse cx="32" cy="30" rx="6" ry="2.4"/></g><circle cx="32" cy="30" r="1" fill="#8a5e34"/>`,
    ),
  ash: (a) =>
    svg(
      `<rect width="64" height="64" fill="#2c2926"/>` +
        `<g fill="#1a1816"><ellipse cx="22" cy="26" rx="14" ry="8"/><ellipse cx="44" cy="44" rx="15" ry="9"/></g>` +
        `<g fill="#56514b" opacity=".8"><circle cx="12" cy="44" r="1.4"/><circle cx="36" cy="14" r="1.2"/><circle cx="52" cy="24" r="1.5"/><circle cx="28" cy="54" r="1.1"/></g>` +
        `<g stroke="#0f0d0c" stroke-width="3" stroke-linecap="round"><path d="M14 30l14-6M36 48l14 2"/></g>` +
        `<g fill="#ff8a3a"><circle cx="22" cy="28" r="1.2">${anim(a, loop("opacity", ".2;1;.2", "2.8s"))}</circle><circle cx="46" cy="46" r="1.1">${anim(a, loop("opacity", ".2;.9;.2", "3.4s", "1.2s"))}</circle><circle cx="40" cy="20" r=".9" opacity=".6"/></g>`,
    ),
  fire: (a) =>
    svg(
      `<rect width="64" height="64" fill="#2a1610"/><ellipse cx="32" cy="50" rx="28" ry="14" fill="#6a2a12" opacity=".7"/><ellipse cx="32" cy="52" rx="18" ry="7" fill="#b3461a" opacity=".6">${anim(a, loop("opacity", ".4;.75;.4", "1.4s"))}</ellipse>` +
        flame(20, 54, 0.75, a && "1.1s", "0s") +
        flame(44, 55, 0.7, a && "0.9s", ".3s") +
        flame(32, 58, 1, a && "1.3s", ".15s"),
    ),
  // Plain ground under the object sprites.
  tree: () => svg(MOSS),
  sporepod: () => svg(MOSS),
  barrel: () => svg(EARTH),
  boulder: () => svg(EARTH),
  icepillar: () => svg(FROST),
}

// Corruption ooze, drawn over any terrain (the Blight overlay).
const BLIGHT_SVG = svg(
  `<path d="M6 30C2 18 12 6 24 8C30 2 42 4 46 10C58 10 62 24 56 32C62 42 54 56 42 54C36 62 22 60 18 52C6 52 2 40 6 30Z" fill="#240c30" opacity=".82"/>` +
    `<g fill="none" stroke-linecap="round"><path d="M12 30Q4 26 0 30M22 12Q18 4 20 0M46 12Q52 4 58 2M56 36Q62 40 64 38M40 54Q44 60 42 64M18 50Q10 58 4 60" stroke="#2c0f3a" stroke-width="3"/></g>` +
    `<path d="M14 32C12 22 22 14 32 16C44 14 52 24 50 34C52 44 42 50 32 48C22 50 14 42 14 32Z" fill="#43175a"/>` +
    `<path d="M22 30C22 25 27 22 32 23C38 22 42 27 41 32C42 38 36 41 31 40C26 41 22 36 22 30Z" fill="#5c2478" opacity=".8"/>` +
    `<g fill="none" stroke="#8a44a8" stroke-width=".9" opacity=".6" stroke-linecap="round"><path d="M24 20q-4-6-2-10M42 22q6-4 10-2M44 40q6 4 8 10M22 42q-6 4-8 10"/></g>` +
    `<ellipse cx="27" cy="26" rx="5" ry="2" fill="#c07ae0" opacity=".4"/>` +
    `<g fill="#9cc43c" opacity=".75"><circle cx="38" cy="36" r="1.3"/><circle cx="24" cy="38" r="1"/><circle cx="46" cy="26" r=".9"/></g>`,
)

const toUrl = (s) => `url("data:image/svg+xml,${encodeURIComponent(s)}")`
const ART = {}
for (const [type, build] of Object.entries(TERRAIN_SVG)) ART[type] = { live: toUrl(build(true)), still: toUrl(build(false)) }
export const BLIGHT_ART_URL = toUrl(BLIGHT_SVG)
export const TERRAIN_ART_TYPES = Object.keys(ART)

export function hasTerrainArt(type) {
  return !!ART[type]
}

// Inline style for a board cell: the art rides the existing background stack.
export function terrainArtStyle(type) {
  const a = ART[type]
  return a ? { "--hwt-art": a.live, "--hwt-art-still": a.still } : undefined
}

// ---------- Object sprites (inline SVG) ----------

const SHADOW = <ellipse cx="32" cy="58" rx="18" ry="3.6" fill="#000" opacity=".45" />

function TreeSprite({ burning }) {
  const leaf = burning ? ["#3a2616", "#57341a", "#6e4020", "#8a5424"] : ["#1f3414", "#335a22", "#447330", "#5f8f3e"]
  return (
    <>
      {SHADOW}
      <path d="M28 58l1.5-20h5l1.5 20z" fill="#5a3a20" />
      <path d="M29.5 58l1-20h1.6l-.6 20z" fill="#7a5230" />
      <path d="M28 58q-5 0-7 2M36 58q5 0 7 2" stroke="#5a3a20" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="24" r="18" fill={leaf[0]} />
      <circle cx="20" cy="31" r="11" fill={leaf[1]} />
      <circle cx="44" cy="31" r="11" fill={leaf[1]} />
      <circle cx="32" cy="22" r="14" fill={leaf[2]} />
      <circle cx="27" cy="15" r="8" fill={leaf[3]} opacity=".85" />
      <circle cx="42" cy="22" r="4" fill={leaf[3]} opacity=".6" />
      {burning && (
        <g className="hwt-art-flames">
          <path d="M22 26c-6-6-2-14 2-18 0 5 4 6 4 10 2-3 1-6 1-9 6 5 8 12 4 17z" fill="#e0561c" />
          <path d="M34 22c-4-5-1-11 2-14 0 4 3 5 3 8 2-2 2-4 2-6 4 4 5 9 2 12z" fill="#f29a2e" />
          <path d="M25 24c-2-3 0-6 1-8 1 3 3 3 3 6z" fill="#ffd98a" />
        </g>
      )}
    </>
  )
}

function BarrelSprite() {
  return (
    <>
      {SHADOW}
      <path d="M18 22q-3 16 0 34h28q3-18 0-34z" fill="#7c5230" />
      <path d="M18 22q-3 16 0 34h6q-2-17 0-34z" fill="#96663c" />
      <path d="M40 22q2 17 0 34h6q3-18 0-34z" fill="#5a3a1f" />
      <path d="M26 22v34M32 22v34M38 22v34" stroke="#553619" strokeWidth=".9" />
      <g fill="#3b3b40">
        <path d="M17.3 27h29.4v3.4H17.3z" />
        <path d="M16.6 37.5h30.8v3.4H16.6z" />
        <path d="M17.3 48h29.4v3.4H17.3z" />
      </g>
      <path d="M17.3 27h29.4M16.6 37.5h30.8M17.3 48h29.4" stroke="#8a8a92" strokeWidth=".7" />
      <ellipse cx="32" cy="22" rx="14" ry="4" fill="#5e3c20" />
      <ellipse cx="32" cy="22" rx="11" ry="2.8" fill="#3c2412" />
      <path d="M27 33l10 10M37 33L27 43" stroke="#c8452e" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M36 21q2-7 8-9q3-1 4-5" stroke="#2b2b2b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle className="hwt-art-spark" cx="48" cy="7" r="2.6" fill="#ffd27a" />
      <circle cx="48" cy="7" r="1.2" fill="#fff4d0" />
    </>
  )
}

function SporeSprite() {
  return (
    <>
      {SHADOW}
      <path d="M27 58q-1.5-12 2-20h6q3.5 8 2 20z" fill="#e3d4b1" />
      <path d="M33 38h2q3.5 8 2 20h-3z" fill="#b8a582" />
      <path d="M9 40Q10 14 32 12q22 2 23 28q-23 7-46 0z" fill="#9a3244" />
      <path d="M9 40q23 7 46 0q-1 3-3 4q-20 5-40 0q-2-1-3-4z" fill="#5a1b28" />
      <path d="M14 30q4-14 18-16q-12 5-14 18z" fill="#c25366" opacity=".7" />
      <g fill="#efe3c6">
        <ellipse cx="24" cy="24" rx="3.4" ry="2.6" />
        <ellipse cx="38" cy="20" rx="2.6" ry="2" />
        <ellipse cx="45" cy="31" rx="3" ry="2.3" />
        <ellipse cx="30" cy="33" rx="2.4" ry="1.8" />
        <ellipse cx="16" cy="35" rx="2" ry="1.5" />
      </g>
      <g className="hwt-art-spores" fill="#b6e05a">
        <circle cx="14" cy="10" r="1.5" />
        <circle cx="52" cy="8" r="1.2" />
        <circle cx="46" cy="4" r="1" />
      </g>
    </>
  )
}

function BoulderSprite() {
  return (
    <>
      <ellipse cx="32" cy="57" rx="23" ry="4.5" fill="#000" opacity=".5" />
      <path d="M8 42Q6 22 22 13Q34 6 46 13Q60 22 56 42Q52 56 32 56Q12 56 8 42z" fill="#76706a" />
      <path d="M56 42Q52 56 32 56Q12 56 8 42Q20 50 34 48Q48 46 56 34z" fill="#4c4843" />
      <path d="M14 28Q18 14 32 12Q22 18 18 30z" fill="#a39c90" opacity=".65" />
      <path d="M22 13q8-3 14 0q-4 2-6 5q-5-3-8-5z" fill="#4f6b2e" opacity=".9" />
      <path d="M30 24l4 8-3 6 5 8M44 22l-3 7" stroke="#34302c" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  )
}

function IcePillarSprite({ brittle }) {
  return (
    <>
      <ellipse cx="32" cy="58" rx="20" ry="3.6" fill="#0a1a24" opacity=".5" />
      <path d="M14 58l-2-20 5-6 6 5 2 21z" fill="#6fa9c6" />
      <path d="M12 38l5-6 6 5z" fill="#d6f1fb" />
      <path d="M44 58l2-24 6-5 5 7-3 22z" fill="#78b2cc" />
      <path d="M46 34l6-5 5 7z" fill="#d6f1fb" />
      <path d="M22 58V16l10-12 10 12v42z" fill="#9fd4ec" />
      <path d="M22 16L32 4v54H22z" fill="#c8ebf8" />
      <path d="M36 16v42h6V16z" fill="#6aa9c8" />
      <path d="M22 16L32 4l10 12L32 22z" fill="#eafaff" />
      <path d="M22 58V16l10-12 10 12v42" fill="none" stroke="#f2fcff" strokeWidth=".9" opacity=".8" />
      {brittle && <path d="M28 20l4 8-3 7 5 7-2 8M36 30l-4 5" stroke="#1d4a63" strokeWidth="1.3" fill="none" strokeLinecap="round" />}
    </>
  )
}

const SPRITES = { tree: TreeSprite, barrel: BarrelSprite, sporepod: SporeSprite, boulder: BoulderSprite, icepillar: IcePillarSprite }

export function ObjectArt({ type, burning = false, brittle = false, className = "hwt-object-art" }) {
  const Sprite = SPRITES[type]
  if (!Sprite) return null
  return (
    <svg className={className} data-art-object={type} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <Sprite burning={burning} brittle={brittle} />
    </svg>
  )
}

// Mini legend icon: the same tile art (terrain) or sprite on its ground (object).
export function TerrainIcon({ type }) {
  if (!ART[type]) return null
  return (
    <span className="hwt-legend-icon" data-art-icon={type} style={{ backgroundImage: ART[type].still }} aria-hidden="true">
      {OBJECTS[type] && <ObjectArt type={type} className="hwt-legend-icon-sprite" />}
    </span>
  )
}

export function BlightIcon() {
  return <span className="hwt-legend-icon" data-art-icon="blight" style={{ backgroundImage: `${BLIGHT_ART_URL}, ${ART.forest.still}` }} aria-hidden="true" />
}
