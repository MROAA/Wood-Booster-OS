// Hearthwood battlefield, piece 4 - the forest answers the fight.
// Plan: docs/hearthwood-battlefield-plan.md §4b + §6 (PRD "Taistelun
// animaatiot ja ympäristön reagointi").
//
// Purpose: small, short ground reactions around a unit (or on a tile)
// when something happens - leaves and dust puff up from a blow, flowers
// open under a heal, roots rise for root magic, rime creeps for frost,
// embers lift for fire, spores drift for poison, and a fallen unit leaves
// a forest spirit rising. Same technique as TacticsFx sparks: short-lived
// short-lived elements animated with the Web Animations API - but drawn
// INSIDE the board, between the floor and the tokens: a hero card fills its
// tile, so the ground answers AROUND the card and never covers its numbers.
// Only things that rise (a forest spirit, embers, spores) draw above.
//
// Rules: every reaction is under ~1.4 s and never blocks input; the total
// number of live particles is capped (performance, PRD §9); nothing runs
// under reduced motion.
//
// Public API: forestReact(kind, at, colours) where kind is one of REACTIONS'
// keys, at = { x, y } viewport pixels (the ground point), colours = the
// biome's detail colours ({ leaf: [...] }), ground = the tile's terrain id
// (rustle only). feetOfUnit(id) / feetOfTile(pos)
// give the ground point.

const MAX_LIVE = 80
const reduceMotion = () =>
  document.documentElement.classList.contains("hw-reduce-motion") || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
const live = () => document.querySelectorAll(".hwt-fr").length

export function feetOfUnit(unitId) {
  const el = document.querySelector(`.hwt-token[data-unit-id="${unitId}"], .hwt-token-fallen[data-unit-id="${unitId}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.bottom - 4 }
}

export function feetOfTile(pos) {
  const board = document.querySelector(".hwt-board")
  if (!board || !pos) return null
  const cell = board.querySelector(`.hwt-cell[data-cell="${pos.row}-${pos.col}"]`)
  if (!cell) return null
  const r = cell.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.72 }
}

// Pieces that rise over the cards; everything else is ground level.
const OVER = new Set(["wisp", "ember", "spore", "manamote"])
function make(kind, at, html = "") {
  const el = document.createElement("div")
  el.className = "hwt-fr"
  el.dataset.fr = kind
  const board = document.querySelector(".hwt-board")
  if (board) {
    // board-relative (absolute) so it sits between the floor and the tokens
    const r = board.getBoundingClientRect()
    el.dataset.layer = OVER.has(kind) ? "over" : "ground"
    el.style.left = `${at.x - r.left - board.clientLeft}px`
    el.style.top = `${at.y - r.top - board.clientTop}px`
    if (html) el.innerHTML = html
    board.appendChild(el)
    return el
  }
  el.dataset.layer = "screen"
  el.style.left = `${at.x}px`
  el.style.top = `${at.y}px`
  if (html) el.innerHTML = html
  document.body.appendChild(el)
  return el
}
// The easing curve shapes EACH step between keyframes (an overshooting
// curve on the whole run would race through every step and overshoot past
// the end - roots and flowers flashed by in half the time).
function run(el, frames, opts) {
  const { easing = "linear", ...rest } = opts
  const stepped = frames.length > 2 ? frames.map((f, i) => (i < frames.length - 1 && !f.easing ? { ...f, easing } : f)) : frames
  el.animate(stepped, { fill: "forwards", ...rest, easing: frames.length > 2 ? "linear" : easing }).finished.finally(() => el.remove())
}
// deterministic spread so a reaction looks the same every time
const spread = (i, n, span = Math.PI * 2, start = 0) => start + (i / n) * span + (i % 2 ? 0.35 : -0.2)

const FLOWER_SVG = (c) =>
  `<svg viewBox="-6 -6 12 12" width="17" height="17">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-2.6" rx="1.7" ry="2.6" fill="${c}" transform="rotate(${a})"/>`).join("")}<circle r="1.4" fill="#e2b84a"/></svg>`
const ROOT_SVG = (d) => `<svg viewBox="-12 -40 24 42" width="28" height="50"><path d="${d}" stroke="#3a2a1b" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#7a5a3a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`
const ROOT_PATHS = ["M0 0C-2-10 4-16 0-26C-3-32 2-36 1-38", "M0 0C3-8-3-14 1-22C3-26 0-30 2-32", "M0 0C-1-6 3-10 0-18", "M0 0C2-9-4-15 0-24C2-29-1-33 1-36"]
const ROOT_X = [-42, 40, -30, 30]

const REACTIONS = {
  // a blow: leaves and dust puff up from the ground and settle
  hit(at, colours) {
    const leaves = colours?.leaf?.length ? colours.leaf : ["#b5602a", "#c98a2e", "#8e3f1f"]
    for (let i = 0; i < 5; i++) {
      const el = make("leaf", at)
      el.style.background = leaves[i % leaves.length]
      const a = spread(i, 5, Math.PI, Math.PI)
      const dx = (i % 2 ? 1 : -1) * (34 + (i % 3) * 9) + Math.cos(a) * 4
      run(
        el,
        [
          { translate: "0 0", rotate: "0deg", opacity: 0.95 },
          { translate: `${dx * 0.75}px ${-22 - (i % 3) * 7}px`, rotate: `${160 + i * 40}deg`, opacity: 0.95, offset: 0.45 },
          { translate: `${dx}px ${6 + (i % 2) * 4}px`, rotate: `${300 + i * 50}deg`, opacity: 0 },
        ],
        { duration: 640 + i * 30, easing: "cubic-bezier(.2,.7,.4,1)" },
      )
    }
    for (let i = 0; i < 3; i++) {
      const el = make("dust", { x: at.x + (i - 1) * 30, y: at.y })
      run(el, [{ scale: 0.5, opacity: 0.7 }, { scale: 1.8, opacity: 0, translate: `${(i - 1) * 14}px -6px` }], { duration: 560, easing: "ease-out" })
    }
  },
  // a heal: small flowers open at the feet, a warm ring spreads
  heal(at, colours) {
    const petals = colours?.flower?.length ? colours.flower : ["#e8e2c8", "#8fb0e0", "#e2c25a"]
    const ring = make("ring", at)
    run(ring, [{ scale: 0.3, opacity: 0.8 }, { scale: 1.5, opacity: 0 }], { duration: 760, easing: "ease-out" })
    for (let i = 0; i < 5; i++) {
      const a = spread(i, 5, Math.PI * 2, -Math.PI / 2)
      const p = { x: at.x + Math.cos(a) * 42, y: at.y + 4 + Math.sin(a) * 10 }
      const el = make("flower", p, FLOWER_SVG(petals[i % petals.length]))
      run(
        el,
        [
          { scale: 0, rotate: "-40deg", opacity: 0 },
          { scale: 1.15, rotate: "0deg", opacity: 1, offset: 0.35 },
          { scale: 1, opacity: 1, offset: 0.75 },
          { scale: 0.85, opacity: 0, translate: "0 -6px" },
        ],
        { duration: 1000, delay: i * 50, easing: "cubic-bezier(.3,1.4,.5,1)" },
      )
    }
  },
  // root magic: roots rise out of the ground and sink back
  root(at) {
    ROOT_PATHS.forEach((d, i) => {
      const el = make("root", { x: at.x + ROOT_X[i], y: at.y + 6 }, ROOT_SVG(d))
      run(
        el,
        [
          { scale: "1 0", opacity: 1 },
          { scale: "1 1", opacity: 1, offset: 0.35 },
          { scale: "1 1", opacity: 1, offset: 0.7 },
          { scale: "1 0", opacity: 0.6 },
        ],
        { duration: 900, delay: i * 60, easing: "cubic-bezier(.3,1.3,.5,1)" },
      )
    })
  },
  // frost: rime creeps across the ground, crystals glint
  frost(at) {
    const rime = make("rime", at)
    run(rime, [{ scale: 0.2, opacity: 0.9 }, { scale: 1.2, opacity: 0.7, offset: 0.6 }, { scale: 1.3, opacity: 0 }], { duration: 900, easing: "ease-out" })
    for (let i = 0; i < 6; i++) {
      const a = spread(i, 6)
      const el = make("crystal", { x: at.x + Math.cos(a) * 42, y: at.y + 4 + Math.sin(a) * 10 })
      run(el, [{ scale: 0, opacity: 0 }, { scale: 1, opacity: 1, offset: 0.4 }, { scale: 0.6, opacity: 0, translate: "0 -10px" }], { duration: 760, delay: i * 40, easing: "ease-out" })
    }
  },
  // fire: embers lift and the ground glows
  fire(at) {
    const glow = make("glow", at)
    run(glow, [{ scale: 0.5, opacity: 0.85 }, { scale: 1.3, opacity: 0 }], { duration: 700, easing: "ease-out" })
    for (let i = 0; i < 7; i++) {
      const el = make("ember", { x: at.x + (i - 3) * 12, y: at.y })
      const sway = (i % 2 ? 1 : -1) * (6 + (i % 3) * 4)
      run(el, [{ translate: "0 0", opacity: 1 }, { translate: `${sway}px ${-24 - (i % 4) * 8}px`, opacity: 0.9, offset: 0.5 }, { translate: `${-sway * 0.5}px ${-48 - (i % 4) * 10}px`, opacity: 0 }], { duration: 760 + (i % 3) * 120, easing: "ease-out" })
    }
  },
  // poison: spores drift up from the ground
  poison(at) {
    for (let i = 0; i < 5; i++) {
      const el = make("spore", { x: at.x + (i - 2) * 18, y: at.y })
      run(el, [{ scale: 0.4, opacity: 0.85 }, { scale: 1.4, opacity: 0.6, translate: `${(i - 2) * 4}px -18px`, offset: 0.6 }, { scale: 1.8, opacity: 0, translate: `${(i - 2) * 6}px -30px` }], { duration: 1000 + i * 60, easing: "ease-out" })
    }
  },
  // a hero steps into tall grass / moss / dry leaves: it rustles
  rustle(at, colours, ground) {
    const leafy = ground === "leaves"
    const leaves = colours?.leaf?.length ? colours.leaf : ["#b5602a", "#c98a2e"]
    for (let i = 0; i < 5; i++) {
      const el = make(leafy ? "leaf" : "blade", { x: at.x + (i < 2 ? -44 + i * 8 : i === 2 ? 0 : 28 + (i - 3) * 8), y: at.y + 6 })
      if (leafy) el.style.background = leaves[i % leaves.length]
      const lean = (i - 2) * 9
      run(
        el,
        [
          { rotate: "0deg", translate: "0 0", opacity: 0.9 },
          { rotate: `${lean}deg`, translate: `${(i - 2) * 3}px ${leafy ? -12 : -4}px`, opacity: 0.9, offset: 0.4 },
          { rotate: `${-lean * 0.4}deg`, translate: `${(i - 2) * 5}px ${leafy ? 2 : 0}px`, opacity: 0 },
        ],
        { duration: 560 + i * 25, easing: "ease-out" },
      )
    }
  },
  // crushed ground: just the dust
  dust(at) {
    for (let i = 0; i < 3; i++) {
      const el = make("dust", { x: at.x + (i - 1) * 22, y: at.y })
      run(el, [{ scale: 0.5, opacity: 0.65 }, { scale: 1.8, opacity: 0, translate: `${(i - 1) * 10}px -8px` }], { duration: 600, easing: "ease-out" })
    }
  },
  // battlefield piece 6: a mana crystal shatters - violet shards fly out
  // along the ground and motes of mana rise over the cards
  mana(at) {
    const ring = make("manaring", at)
    run(ring, [{ scale: 0.3, opacity: 0.9 }, { scale: 1.6, opacity: 0 }], { duration: 700, easing: "ease-out" })
    for (let i = 0; i < 6; i++) {
      const a = spread(i, 6, Math.PI * 2)
      const el = make("shard", at)
      run(el, [{ translate: "0 0", rotate: "0deg", opacity: 1 }, { translate: `${Math.cos(a) * 44}px ${Math.sin(a) * 14 - 6}px`, rotate: `${120 + i * 50}deg`, opacity: 0 }], { duration: 520 + (i % 3) * 60, easing: "cubic-bezier(.2,.7,.4,1)" })
    }
    for (let i = 0; i < 5; i++) {
      const el = make("manamote", { x: at.x + (i - 2) * 14, y: at.y - 6 })
      run(el, [{ translate: "0 0", opacity: 0 }, { translate: `${(i - 2) * 3}px -26px`, opacity: 1, offset: 0.3 }, { translate: `${(i - 2) * 5}px ${-60 - (i % 2) * 12}px`, opacity: 0 }], { duration: 1100 + i * 70, easing: "ease-out" })
    }
  },
  // a unit falls: a forest spirit rises from where it stood
  spirit(at) {
    const el = make("wisp", at)
    run(
      el,
      [
        { translate: "0 0", scale: 0.4, opacity: 0 },
        { translate: "-6px -20px", scale: 1, opacity: 0.95, offset: 0.25 },
        { translate: "8px -46px", scale: 0.9, opacity: 0.8, offset: 0.6 },
        { translate: "-4px -72px", scale: 0.6, opacity: 0 },
      ],
      { duration: 1400, easing: "ease-in-out" },
    )
  },
}
export const REACTION_KINDS = Object.keys(REACTIONS)

export function forestReact(kind, at, colours, ground = null) {
  if (!at || !REACTIONS[kind] || reduceMotion() || live() > MAX_LIVE) return
  REACTIONS[kind](at, colours, ground)
}

// Ground a hero rustles when stepping onto it.
export const RUSTLE_GROUND = new Set(["bush", "moss", "leaves", "forest"])
