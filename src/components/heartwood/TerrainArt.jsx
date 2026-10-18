// Hearthwood Frontier - terrain & object tile art (inline SVG, no raster assets).
//
// Terrain: one small SVG per type, served as a data-URI background so it slots
// into the cell's existing background stack (`--hwt-tile-pattern`) - every zone
// tint / move ring / telegraph keeps painting ON TOP of it with zero changes.
// Each type has an animated and a still version (reduced motion picks still).
// Objects (tree, barrel, spore pod, boulder, ice pillar, runestone, glowcap): inline JSX SVG sprites.
// Pure presentation - no game rules here.
import { OBJECTS } from "../../services/heartwood/tacticsObjects"

const svg = (body, defs = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" preserveAspectRatio="none">${defs ? `<defs>${defs}</defs>` : ""}${body}</svg>`
const anim = (on, s) => (on ? s : "")
const loop = (attr, values, dur, begin = "0s") =>
  `<animate attributeName="${attr}" values="${values}" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>`

// Shared ground plates (muted, dark - the tavern board).
// Battlefield pass: features sit ON the painted forest floor - their
// ground is a soft patch fading to nothing at the edges, not a solid box.
const EARTH = `<ellipse cx="32" cy="34" rx="31" ry="29" fill="#29231b" opacity=".28"/><ellipse cx="32" cy="34" rx="25" ry="23" fill="#29231b" opacity=".35"/><ellipse cx="32" cy="35" rx="18" ry="16" fill="#29231b" opacity=".45"/><circle cx="14" cy="18" r="1.4" fill="#3a3127"/><circle cx="46" cy="12" r="1" fill="#3a3127"/><circle cx="52" cy="46" r="1.3" fill="#1d1812"/><circle cx="20" cy="50" r="1" fill="#3a3127"/>`
const MOSS = `<ellipse cx="32" cy="34" rx="31" ry="29" fill="#1f2818" opacity=".28"/><ellipse cx="32" cy="34" rx="25" ry="23" fill="#1f2818" opacity=".35"/><ellipse cx="32" cy="35" rx="18" ry="16" fill="#1f2818" opacity=".45"/><circle cx="12" cy="14" r="5" fill="#263220"/><circle cx="50" cy="20" r="6" fill="#243019"/><circle cx="24" cy="50" r="7" fill="#243019"/><circle cx="54" cy="52" r="3" fill="#2a3722"/>`
const FROST = `<ellipse cx="32" cy="34" rx="31" ry="29" fill="#26323a" opacity=".28"/><ellipse cx="32" cy="34" rx="25" ry="23" fill="#26323a" opacity=".35"/><ellipse cx="32" cy="35" rx="18" ry="16" fill="#26323a" opacity=".45"/><circle cx="16" cy="20" r="6" fill="#2e3d46"/><circle cx="48" cy="46" r="8" fill="#2c3a43"/>`

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

const flame = (x, y, s, dur, begin) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><g>` +
  `<path d="M0 0C-11 0-12-12-5-22C-5-15 1-15-1-28C9-19 11-8 10-4C9 0 5 0 0 0Z" fill="#d9531c"/>` +
  `<path d="M0 0C-6 0-7-7-3-13C-2-9 2-9 1-17C6-11 7-5 6-3C5 0 3 0 0 0Z" fill="#f29a2e"/>` +
  `<path d="M0 0C-3 0-3-4-1-7C0-5 2-5 2-8C4-5 4-2 3-1C2 0 1 0 0 0Z" fill="#ffd98a"/>` +
  `%ANIM%</g></g>`.replace("%ANIM%", dur ? `<animateTransform attributeName="transform" type="scale" values="1 1;.9 1.12;1.04 .94;1 1" dur="${dur}" begin="${begin}" repeatCount="indefinite"/>` : "")

// Battlefield piece 2 helpers: an autumn grass clump and a small spruce.
const GRASS = ["#34461b", "#4f6426", "#6b7a2c", "#8f8a34", "#3e5220", "#b0943a"]
const grassClump = (x, y, h, i, a) => {
  const leans = [-7, -4, -1, 2, 5, 8]
  const blades = leans
    .map((lean, j) => {
      const c = j === 3 && i % 3 === 0 ? "#a5602a" : GRASS[(i + j) % GRASS.length]
      const hh = h - Math.abs(lean) * 0.5 + (j % 2) * 2
      return `<path d="M${x} ${y}q${lean * 0.3} ${-hh * 0.55} ${lean} ${-hh}" stroke="${c}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`
    })
    .join("")
  // a seed head on some clumps only (a meadow, not a wheat field)
  const seeds = (i % 3 === 1 ? [leans[3]] : i % 3 === 2 ? [leans[1]] : [])
    .map((lean) => {
      const hh = h - Math.abs(lean) * 0.5 + 2
      return `<ellipse cx="${x + lean}" cy="${y - hh - 1}" rx=".9" ry="2" fill="#c9b273" opacity=".8" transform="rotate(${lean * 3} ${x + lean} ${y - hh - 1})"/>`
    })
    .join("")
  const sway = a ? `<animateTransform attributeName="transform" type="rotate" values="-2 ${x} ${y};2.5 ${x} ${y};-2 ${x} ${y}" dur="${4 + (i % 3) * 0.7}s" begin="-${i * 0.6}s" repeatCount="indefinite"/>` : ""
  return `<ellipse cx="${x}" cy="${y + 1}" rx="7" ry="2" fill="#0d1208" opacity=".55"/><g>${blades}${seeds}${sway}</g>`
}
const spruceSvg = (x, base, s, lit = "#3d6238") =>
  `<g transform="translate(${x} ${base}) scale(${s})">` +
  `<ellipse cx="0" cy="1" rx="11" ry="2.6" fill="#0d1208" opacity=".6"/><rect x="-1.4" y="-6" width="2.8" height="7" fill="#4a3220"/>` +
  [
    [-30, 6, 10],
    [-20, 9, 11],
    [-10, 12, 12],
  ]
    .map(
      ([cy, w, h]) =>
        `<path d="M0 ${cy - h}L${w} ${cy}L${w * 0.5} ${cy - 1.4}L0 ${cy - 0.6}L${-w * 0.5} ${cy - 1.4}L${-w} ${cy}Z" fill="#16261a"/>` +
        `<path d="M0 ${cy - h + 1}L${-w + 1.2} ${cy - 0.8}L${-w * 0.5} ${cy - 2}L0 ${cy - 1.4}Z" fill="${lit}" opacity=".85"/>`,
    )
    .join("") +
  `</g>`

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
  // Battlefield piece 2: autumn tall grass - olive-to-gold blades with seed
  // heads, a copper blade here and there, swaying gently (still when reduced).
  bush: (a) =>
    svg(
      MOSS +
        [
          [14, 26, 15, 0],
          [36, 20, 16, 1],
          [54, 28, 13, 2],
          [24, 42, 17, 3],
          [48, 46, 16, 4],
          [10, 58, 14, 5],
          [32, 60, 17, 6],
          [56, 61, 13, 7],
        ]
          .map(([x, y, h, i]) => grassClump(x, y, h, i, a))
          .join(""),
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
  // Battlefield: on the board, high ground is drawn as one continuous mound
  // by ForestFloor.jsx HillLayer (the tile itself stays clear). This art is
  // the legend icon: a small grassy mound with its cliff and shadow.
  high: () =>
    svg(
      `<ellipse cx="34" cy="52" rx="27" ry="8" fill="#000" opacity=".35"/>` +
        `<path d="M6 44C8 26 20 14 32 14C44 14 56 26 58 44Z" fill="#5d6c31"/>` +
        `<path d="M6 44C8 26 20 14 32 14C24 18 16 28 15 44Z" fill="#7d8c45" opacity=".7"/>` +
        `<path d="M58 44C56 30 48 20 40 16C46 24 49 34 49 44Z" fill="#26311a" opacity=".55"/>` +
        `<path d="M6 44H58L56 52H8Z" fill="#5c4228"/><path d="M8 48H56" stroke="#24180d" stroke-width=".9" opacity=".6"/>` +
        `<path d="M7 44.6H57" stroke="#a3b263" stroke-width="1.4" opacity=".6"/>` +
        `<g stroke="#a3b263" stroke-width="1.2" stroke-linecap="round" opacity=".75"><path d="M26 28l-2-5M26 28l1-6M40 32l-1-5M40 32l2-4"/></g>`,
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
        `<path d="M22 30l3 7-2 5M46 20l-2 6" stroke="#2c2924" stroke-width="1" fill="none"/>` +
        // Battlefield piece 2: moss caps and lichen (sammal ja jäkälä)
        `<path d="M11 31C14 25 22 23 28 26C24 27 22 30 18 29C15 29 13 31 11 33Z" fill="#4f6b2e"/><path d="M14 28C17 25 21 25 23 26C20 27 17 27 14 29Z" fill="#7a9a4a" opacity=".7"/>` +
        `<path d="M36 19C38 14 45 12 50 14C46 15 44 17 40 17C38 17 37 18 36 20Z" fill="#4f6b2e"/>` +
        `<g fill="#b4bc8f" opacity=".75"><circle cx="30" cy="36" r="1.2"/><circle cx="33" cy="39" r=".8"/><circle cx="50" cy="24" r="1.1"/><circle cx="44" cy="28" r=".7"/><circle cx="47" cy="49" r=".9"/></g>`,
    ),
  // Battlefield piece 2: open woodland - two young spruces and undergrowth.
  forest: () =>
    svg(
      MOSS +
        spruceSvg(17, 30, 0.82) +
        spruceSvg(46, 58, 1.05, "#467040") +
        `<g fill="none" stroke="#4d6d30" stroke-width="1.3" stroke-linecap="round"><path d="M30 44q2-5 7-6M33 44q0-4 3-7M8 52q4-3 8-2"/></g>` +
        `<g fill="#b5602a" opacity=".85"><ellipse cx="30" cy="20" rx="1.8" ry="1.1" transform="rotate(30 30 20)"/><ellipse cx="24" cy="56" rx="1.8" ry="1.1" transform="rotate(-20 24 56)"/></g>` +
        `<g fill="#6d8c3a" opacity=".6"><circle cx="54" cy="16" r="1"/><circle cx="8" cy="40" r="1"/></g>`,
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
  // Chaos sprint: a bed of iron spikes (promotion zone skills plant them).
  spikes: (a) =>
    svg(
      EARTH +
        `<g fill="#15130f" opacity=".55">${[[16, 20], [40, 16], [28, 38], [52, 40], [14, 52], [44, 56]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 4}" rx="7" ry="2"/>`).join("")}</g>` +
        `<g stroke="#2b2622" stroke-width=".6">${[[16, 20], [40, 16], [28, 38], [52, 40], [14, 52], [44, 56]].map(([x, y]) => `<path d="M${x - 5} ${y + 3}L${x - 3} ${y - 7}L${x - 1} ${y + 3}Z" fill="#9c958a"/><path d="M${x - 1} ${y + 3}L${x + 1} ${y - 10}L${x + 3} ${y + 3}Z" fill="#c8c1b4"/><path d="M${x + 3} ${y + 3}L${x + 5} ${y - 6}L${x + 7} ${y + 3}Z" fill="#8b8478"/>`).join("")}</g>` +
        `<g fill="#e8e2d6">${[[16, 20], [40, 16], [28, 38], [52, 40], [14, 52], [44, 56]].map(([x, y], i) => `<circle cx="${x + 1}" cy="${y - 9}" r=".8">${anim(a, loop("opacity", ".2;1;.2", `${2 + (i % 3) * 0.6}s`, `${i * 0.3}s`))}</circle>`).join("")}</g>`,
    ),
  // Difficulty + mana sprint 2: a Mana Well - a glowing rune pool that pulses.
  manawell: (a) =>
    svg(
      EARTH +
        `<circle cx="32" cy="32" r="25" fill="none" stroke="#3b6fd0" stroke-width="2" opacity=".55" stroke-dasharray="4 3">${anim(a, `<animateTransform attributeName="transform" type="rotate" values="0 32 32;360 32 32" dur="18s" repeatCount="indefinite"/>`)}</circle>` +
        `<circle cx="32" cy="32" r="17" fill="url(#mw)"/>` +
        `<circle cx="32" cy="32" r="17" fill="none" stroke="#9fd2ff" stroke-width="1.4" opacity=".8">${anim(a, loop("r", "15;19;15", "2.6s"))}${anim(a, loop("opacity", ".9;.25;.9", "2.6s"))}</circle>` +
        `<g fill="#cfe9ff" opacity=".85">${[[32, 20], [43, 38], [21, 38]].map(([x, y], i) => `<path d="M${x} ${y - 3}l2 3-2 3-2-3z">${anim(a, loop("opacity", ".2;1;.2", "2.2s", `${i * 0.7}s`))}</path>`).join("")}</g>` +
        `<circle cx="32" cy="32" r="4" fill="#e8f6ff">${anim(a, loop("opacity", ".5;1;.5", "1.6s"))}</circle>`,
      `<radialGradient id="mw"><stop offset="0" stop-color="#7cc4ff" stop-opacity=".95"/><stop offset=".6" stop-color="#2d63c8" stop-opacity=".75"/><stop offset="1" stop-color="#16285a" stop-opacity=".2"/></radialGradient>`,
    ),
  // ---- Battlefield piece 3: the living forest ground ----
  // Moss: a soft cushion of feather moss with little sporophyte stalks.
  moss: (a) =>
    svg(
      MOSS +
        `<g>` +
        [
          [22, 30, 13, 9, "#3f5a26"],
          [40, 28, 14, 10, "#4a6a2b"],
          [30, 42, 15, 10, "#41602a"],
          [48, 44, 9, 7, "#3c5524"],
          [14, 44, 8, 6, "#3c5524"],
        ]
          .map(([x, y, rx, ry, c]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"/><ellipse cx="${x - rx * 0.25}" cy="${y - ry * 0.35}" rx="${rx * 0.6}" ry="${ry * 0.45}" fill="#5f8236" opacity=".75"/>`)
          .join("") +
        `</g><g fill="#7fa24a" opacity=".55">${[[18, 27], [27, 25], [37, 24], [45, 26], [26, 38], [35, 40], [44, 41], [20, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1"/>`).join("")}</g>` +
        `<g stroke="#8a6a3a" stroke-width=".7" fill="none">${[[24, 30], [41, 27], [32, 41], [47, 43]].map(([x, y], i) => `<path d="M${x} ${y}q1-5 0-9">${anim(a, `<animateTransform attributeName="transform" type="rotate" values="-4 ${x} ${y};4 ${x} ${y};-4 ${x} ${y}" dur="${3.5 + i * 0.4}s" repeatCount="indefinite"/>`)}</path>`).join("")}</g>` +
        `<g fill="#c99a52">${[[24, 21], [41, 18], [32, 32], [47, 34]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx=".9" ry="1.4"/>`).join("")}</g>`,
    ),
  // Dry leaves: a crisp pile of copper / amber aspen leaves - reads as tinder.
  leaves: () =>
    svg(
      EARTH +
        `<ellipse cx="32" cy="38" rx="24" ry="15" fill="#3a2414" opacity=".55"/>` +
        [
          [18, 34, -30, "#8e3f1f"],
          [30, 30, 20, "#b5602a"],
          [44, 34, 70, "#c98a2e"],
          [24, 44, 110, "#d9a441"],
          [38, 44, -60, "#a5522a"],
          [50, 42, 15, "#8e3f1f"],
          [32, 38, 150, "#e0b04a"],
          [14, 42, 60, "#c98a2e"],
          [42, 24, -10, "#d9a441"],
          [22, 26, 45, "#b5602a"],
        ]
          .map(
            ([x, y, r, c]) =>
              `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0-8C5-5.5 5.8 3 0 8C-5.8 3-5-5.5 0-8Z" fill="${c}" stroke="#2a1608" stroke-opacity=".45" stroke-width=".7"/><path d="M0-7V9.5M0-2l2.6-1.8M0 1.4l-2.8-2M0 4l2.4-1.6" stroke="#2a1608" stroke-opacity=".4" stroke-width=".55" fill="none"/></g>`,
          )
          .join("") +
        `<g fill="#f2d48a" opacity=".5"><circle cx="29" cy="27" r="1"/><circle cx="43" cy="31" r=".9"/><circle cx="31" cy="35" r=".9"/></g>`,
    ),
  // Roots: old gnarled roots arching up out of the soil and diving back in
  // (dark holes where they enter the ground) - a snare, not loose sticks.
  roots: () =>
    svg(
      EARTH +
        `<ellipse cx="32" cy="36" rx="27" ry="14" fill="#1c140c" opacity=".55"/>` +
        [
          ["M4 44C10 26 24 24 30 40", 6.5, [4, 44], [30, 40]],
          ["M24 30C30 14 46 14 52 32", 7.5, [24, 30], [52, 32]],
          ["M34 52C40 38 54 40 60 50", 5.5, [34, 52], [60, 50]],
          ["M10 56C14 48 20 48 24 56", 3.6, [10, 56], [24, 56]],
        ]
          .map(
            ([d, w, a, b]) =>
              `<ellipse cx="${a[0]}" cy="${a[1] + 1}" rx="${w * 0.9}" ry="${w * 0.45}" fill="#0c0805"/><ellipse cx="${b[0]}" cy="${b[1] + 1}" rx="${w * 0.9}" ry="${w * 0.45}" fill="#0c0805"/>` +
              `<path d="${d}" stroke="#120c07" stroke-width="${w + 2.6}" fill="none" stroke-linecap="round"/>` +
              `<path d="${d}" stroke="#5a4632" stroke-width="${w}" fill="none" stroke-linecap="round"/>` +
              `<path d="${d}" stroke="#8a6e4c" stroke-width="${Math.max(0.9, w * 0.32)}" fill="none" stroke-linecap="round" transform="translate(-.7 -1.2)"/>`,
          )
          .join("") +
        `<g stroke="#3a2a1a" stroke-width="1" fill="none" stroke-linecap="round"><path d="M16 31q-3-4-1-8M40 18q2-5 6-6M48 42q4-3 4-7"/></g>` +
        `<g fill="#4f6b2e"><ellipse cx="38" cy="17" rx="5" ry="2.2"/><ellipse cx="17" cy="30" rx="3.4" ry="1.6"/><ellipse cx="47" cy="41" rx="3" ry="1.4"/></g>` +
        `<g fill="#8fa86a" opacity=".6"><circle cx="37" cy="16" r=".9"/><circle cx="16" cy="29" r=".8"/></g>`,
    ),
  // Branches: a splintered log's pieces.
  branches: () =>
    svg(
      MOSS +
        `<g stroke-linecap="round" fill="none">` +
        [
          ["M8 40L40 28", 4.2],
          ["M20 52L54 40", 3.6],
          ["M28 18L50 50", 3.2],
          ["M12 26L30 36", 2.4],
          ["M40 28l6-6M34 44l-4 7M44 40l5 4", 1.6],
        ]
          .map(([d, w]) => `<path d="${d}" stroke="#000" stroke-opacity=".4" stroke-width="${w + 1.2}" transform="translate(0 2)"/><path d="${d}" stroke="#6a4a2c" stroke-width="${w}"/><path d="${d}" stroke="#9a744a" stroke-width="${Math.max(0.6, w * 0.3)}" transform="translate(-.4 -.8)"/>`)
          .join("") +
        `</g><g fill="#c09058"><ellipse cx="40" cy="28" rx="1.8" ry="2.2"/><ellipse cx="54" cy="40" rx="1.6" ry="2"/><ellipse cx="50" cy="50" rx="1.5" ry="1.9"/></g>` +
        `<g fill="#b5602a" opacity=".85"><ellipse cx="18" cy="30" rx="2" ry="1.2" transform="rotate(30 18 30)"/><ellipse cx="46" cy="22" rx="2" ry="1.2" transform="rotate(-40 46 22)"/></g>`,
    ),
  // Gravel: crushed stone.
  gravel: () =>
    svg(
      EARTH +
        `<g>${[[14, 20, 3], [24, 30, 2.4], [36, 22, 2.8], [48, 30, 2.2], [18, 42, 2.6], [30, 46, 3.2], [44, 44, 2.4], [52, 52, 2], [26, 56, 2], [40, 34, 1.8], [10, 32, 1.8], [54, 18, 1.8]]
          .map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y + 0.8}" rx="${r}" ry="${r * 0.6}" fill="#000" opacity=".35"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="${i % 3 ? "#6b665e" : "#7d776c"}"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.25}" rx="${r * 0.45}" ry="${r * 0.3}" fill="#a39c90" opacity=".6"/>`)
          .join("")}</g>`,
    ),
  // Plain ground under the object sprites.
  stone: () => svg(MOSS),
  glowcap: () => svg(MOSS),
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

// Inline style for a board cell: the art rides the existing background stack.
export function terrainArtStyle(type) {
  const a = ART[type]
  return a ? { "--hwt-art": a.live, "--hwt-art-still": a.still } : undefined
}

// ---------- Object sprites (inline SVG) ----------

const SHADOW = <ellipse cx="32" cy="58" rx="18" ry="3.6" fill="#000" opacity=".45" />

// Battlefield piece 2: three Nordic species, painted with the light from the
// top-left (the same side as the sun shafts). Which species stands on a tile
// is a stable choice made by the board (variant), so a grove is mixed.
const TREE_SPECIES = ["birch", "aspen", "spruce"]
const CANOPY = {
  // koivu - golden autumn birch
  birch: { dark: "#7d5f1e", mid: "#b8902e", light: "#e2bd52", glint: "#f4dc8a", bark: "#e6e0d0", barkDark: "#1d1a16" },
  // haapa - copper-red autumn aspen
  aspen: { dark: "#5e2414", mid: "#9a3d1e", light: "#cc6a2e", glint: "#eba05a", bark: "#8d8a72", barkDark: "#3f3d31" },
}
const BURNT = { dark: "#2a1c12", mid: "#3a2616", light: "#57341a", glint: "#6e4020", bark: "#3a2a1c", barkDark: "#140d08" }

function DeciduousTree({ c, birch }) {
  return (
    <>
      <path d="M22 58q4-1 7-6M42 58q-4-1-6-6" stroke={c.barkDark} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".7" />
      <path d="M28.6 58C29.6 50 29 42 30.4 33h3.2C35 42 34.4 50 35.4 58Z" fill={c.bark} />
      <path d="M33.6 33C35 42 34.4 50 35.4 58h-2.2C32.6 50 33 42 32.2 33Z" fill="#000" opacity=".22" />
      {birch && (
        <g fill={c.barkDark}>
          <path d="M29.4 52h2.6v1.1h-2.6zM31.2 46h2.7v.9h-2.7zM29.8 40h2v.8h-2zM31.6 55h2.8v.8h-2.8z" />
        </g>
      )}
      <path d="M31 41l-6-7M33 38l6-8M30.4 36l-3-6" stroke={c.bark} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* canopy: dark mass, mid clumps, then the lit top-left */}
      <g fill={c.dark}>
        <circle cx="32" cy="24" r="16" />
        <circle cx="18" cy="31" r="11.5" />
        <circle cx="46" cy="31" r="11.5" />
        <circle cx="24" cy="15" r="10" />
        <circle cx="41" cy="15" r="10" />
        <circle cx="25" cy="37" r="8" />
        <circle cx="40" cy="37" r="8" />
      </g>
      <g fill={c.mid}>
        <circle cx="30" cy="21" r="13" />
        <circle cx="17" cy="29" r="9" />
        <circle cx="44" cy="28" r="9" />
        <circle cx="26" cy="34" r="6" />
        <circle cx="23" cy="13" r="8" />
        <circle cx="39" cy="12" r="7.5" />
      </g>
      <g fill={c.light}>
        <circle cx="25" cy="13" r="6" />
        <circle cx="34" cy="10" r="5" />
        <circle cx="18" cy="24" r="5" />
        <circle cx="29" cy="20" r="5.5" opacity=".7" />
      </g>
      <g fill={c.glint} opacity=".9">
        <circle cx="23" cy="10" r="1.6" />
        <circle cx="33" cy="7.5" r="1.3" />
        <circle cx="16" cy="22" r="1.3" />
        <circle cx="27" cy="16" r="1" />
        <circle cx="40" cy="20" r="1" />
        <circle cx="46" cy="26" r=".9" />
      </g>
      <ellipse cx="33" cy="42" rx="15" ry="3.4" fill={c.dark} opacity=".6" />
      <g fill={c.dark}>
        <circle cx="12" cy="34" r="1.2" />
        <circle cx="51" cy="35" r="1.1" />
        <circle cx="47" cy="40" r=".9" />
      </g>
    </>
  )
}

// kuusi - a spruce: jagged tiers, lit on the left faces.
const SPRUCE_TIERS = [
  [16, 8, 13],
  [27, 12, 14],
  [38, 16, 15],
  [50, 20, 15],
]
const tierPath = (cy, w, h) => `M32 ${cy - h}L${32 + w} ${cy}L${32 + w * 0.6} ${cy - 1.6}L${32 + w * 0.3} ${cy + 0.6}L32 ${cy - 1}L${32 - w * 0.3} ${cy + 0.6}L${32 - w * 0.6} ${cy - 1.6}L${32 - w} ${cy}Z`
const tierLit = (cy, w, h) => `M32 ${cy - h}L${32 - w} ${cy}L${32 - w * 0.6} ${cy - 1.6}L${32 - w * 0.3} ${cy + 0.6}L32 ${cy - 1}Z`
function SpruceTree({ burning }) {
  const col = burning ? ["#2a1c12", "#3a2616", "#57341a"] : ["#16261a", "#24402a", "#3d6238"]
  return (
    <>
      <rect x="30.4" y="48" width="3.2" height="10" fill="#4a3220" />
      {SPRUCE_TIERS.map(([cy, w, h]) => (
        <g key={cy}>
          <path d={tierPath(cy, w, h)} fill={col[0]} />
          <path d={tierPath(cy - 1, w - 1.5, h - 1.5)} fill={col[1]} />
          <path d={tierLit(cy - 1, w - 1.5, h - 1.5)} fill={col[2]} opacity=".85" />
        </g>
      ))}
      <path d="M32 3l1.2 3h-2.4z" fill={col[2]} />
    </>
  )
}

function TreeSprite({ burning, variant = 0 }) {
  const species = TREE_SPECIES[Math.abs(variant) % TREE_SPECIES.length]
  return (
    <>
      {SHADOW}
      {species === "spruce" ? <SpruceTree burning={burning} /> : <DeciduousTree c={burning ? BURNT : CANOPY[species]} birch={species === "birch"} />}
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

// Battlefield piece 3: a mossy runestone (bautakivi) with a faintly glowing
// carved rune (Othala - inheritance, the old forest's memory).
function StoneSprite() {
  return (
    <>
      <ellipse cx="32" cy="58" rx="17" ry="3.8" fill="#000" opacity=".5" />
      <path d="M19 58C17 44 18 26 22 16C25 8 36 5 42 11C47 17 47 36 45 58Z" fill="#6c675f" />
      <path d="M45 58C47 36 47 17 42 11C44 20 43 40 39 58Z" fill="#4a4640" />
      <path d="M22 18C25 10 34 7 39 10C32 10 26 14 24 24Z" fill="#9a9387" opacity=".55" />
      <path d="M20 50C24 46 28 50 33 47C38 45 42 49 45 47L45 58H19Z" fill="#3f5a26" />
      <path d="M22 51C25 48 28 51 32 49" stroke="#6f9040" strokeWidth="1.2" fill="none" />
      <path d="M26 12C30 8 37 8 41 12C37 11 31 12 27 15Z" fill="#4f6b2e" />
      <g className="hwt-art-rune" fill="none" stroke="#9fd8c4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M32 22L38 29 32 36 26 29Z" />
        <path d="M27 31L22 40M37 31L42 40" />
      </g>
      <g fill="#b4bc8f" opacity=".7">
        <circle cx="38" cy="18" r="1.1" />
        <circle cx="25" cy="40" r="1" />
        <circle cx="40" cy="44" r=".8" />
      </g>
    </>
  )
}

// Battlefield piece 3: a cluster of glowing mushrooms; spores drift up.
function GlowcapSprite() {
  const caps = [
    [22, 44, 0.85],
    [40, 46, 0.75],
    [31, 40, 1.1],
  ]
  return (
    <>
      <ellipse cx="32" cy="56" rx="19" ry="4" fill="#000" opacity=".45" />
      <circle className="hwt-art-glow" cx="32" cy="38" r="22" fill="url(#hwt-glowcap-halo)" />
      <defs>
        <radialGradient id="hwt-glowcap-halo">
          <stop offset="0" stopColor="#8ff0d4" stopOpacity=".45" />
          <stop offset="1" stopColor="#8ff0d4" stopOpacity="0" />
        </radialGradient>
      </defs>
      {caps.map(([x, y, sc]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${sc})`}>
          <path d="M-2.4 14q-1-8 .6-15h3.6q1.6 7 .6 15z" fill="#e8e2cf" />
          <path d="M1.6-1q1.6 7 .6 15h-1.4q.6-8-.4-15z" fill="#b8b09a" />
          <path d="M-11 0Q-10-12 0-13Q10-12 11 0Q0 3-11 0Z" fill="#5fc9b0" />
          <path d="M-11 0Q0 3 11 0Q9 2.6 0 3.2Q-9 2.6-11 0Z" fill="#2f7f74" />
          <path d="M-7-5Q-5-11 1-11.6Q-5-8-6-3Z" fill="#c4fff0" opacity=".8" />
          <g fill="#e8fff8">
            <circle cx="-3" cy="-7" r="1.2" />
            <circle cx="4" cy="-8" r="1" />
            <circle cx="6" cy="-3" r=".9" />
          </g>
        </g>
      ))}
      <g className="hwt-art-spores" fill="#b8ffe8">
        <circle cx="20" cy="22" r="1.4" />
        <circle cx="44" cy="20" r="1.2" />
        <circle cx="33" cy="14" r="1" />
      </g>
    </>
  )
}

const SPRITES = { tree: TreeSprite, barrel: BarrelSprite, sporepod: SporeSprite, boulder: BoulderSprite, icepillar: IcePillarSprite, stone: StoneSprite, glowcap: GlowcapSprite }

export function ObjectArt({ type, burning = false, brittle = false, variant = 0, className = "hwt-object-art" }) {
  const Sprite = SPRITES[type]
  if (!Sprite) return null
  return (
    <svg className={className} data-art-object={type} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <Sprite burning={burning} brittle={brittle} variant={variant} />
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

// Ranged rework: a smoke cloud drawn over a tile (Smoke Screen).
export function SmokeArt({ turns = 1 }) {
  return (
    <svg className="hwt-smoke-art" data-turns={turns} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g className="hwt-smoke-puffs" fill="#c9c4b8">
        <circle cx="18" cy="38" r="14" opacity=".42" />
        <circle cx="40" cy="30" r="17" opacity=".38" />
        <circle cx="30" cy="46" r="12" opacity=".34" />
        <circle cx="50" cy="46" r="10" opacity=".3" />
        <circle cx="24" cy="22" r="10" opacity=".3" />
      </g>
      <g className="hwt-smoke-wisps" fill="none" stroke="#e8e3d6" strokeWidth="1.6" strokeLinecap="round" opacity=".45">
        <path d="M10 30q6-6 12 0t12 0" />
        <path d="M30 52q6-6 12 0t12 0" />
      </g>
    </svg>
  )
}

export function BlightIcon() {
  return <span className="hwt-legend-icon" data-art-icon="blight" style={{ backgroundImage: `${BLIGHT_ART_URL}, ${ART.forest.still}` }} aria-hidden="true" />
}
