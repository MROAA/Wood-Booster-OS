// Hearthwood - the drawn Commander heroes (docs/hearthwood-hero-avatars-prd.md).
//
// One hand-built, layered SVG per hero, all sharing ONE painting recipe so
// the seven read as a set: light from the top-left, a soft fur gradient, the
// same warm ink line, the same eyes/mouth vocabulary for every reaction.
//
//   variant: "portrait" (square, painted backdrop) | "round" (circle crop,
//            squad lists) | "battle" (no backdrop, cropped to the face so it
//            still reads at 64 px on the board)
//   mood:    "neutral" | "joy" | "hurt" | "victory" | "defeat"
//   skin:    a key of HEROES[id].skins - the drawing reads only the palette,
//            so a new skin never changes who the hero is.
//
// Idle motion (tail flick, breathing, amulet pulse...) is CSS in
// hero-avatars.css, keyed off data-hero, and stops under reduce-motion.

import { useId } from "react"
import { HEROES, skinFor } from "../../data/heartwood/heroes"
import "./hero-avatars.css"

const INK = "#22160e"

// ---------------------------------------------------------------- eyes

// shape: "round" | "almond" | "dark" (all-iris animal eye: reindeer, bear, hare)
// pupil: "slit" | "round"
function Eye({ cx, cy, r, color, mood, shape = "round", pupil = "round", side = 1, glow, fierce, ids }) {
  if (mood === "joy") {
    return <path d={`M${cx - r} ${cy + 1} Q${cx} ${cy - r * 1.15} ${cx + r} ${cy + 1}`} stroke={INK} strokeWidth="1.9" fill="none" strokeLinecap="round" />
  }
  if (mood === "hurt") {
    const d = side < 0
      ? `M${cx - r * 0.8} ${cy - r * 0.6} L${cx + r * 0.6} ${cy} L${cx - r * 0.8} ${cy + r * 0.6}`
      : `M${cx + r * 0.8} ${cy - r * 0.6} L${cx - r * 0.6} ${cy} L${cx + r * 0.8} ${cy + r * 0.6}`
    return <path d={d} stroke={INK} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  }
  if (mood === "defeat") {
    return <path d={`M${cx - r} ${cy - 0.5} Q${cx} ${cy + r * 0.75} ${cx + r} ${cy - 0.5}`} stroke={INK} strokeWidth="1.7" fill="none" strokeLinecap="round" />
  }
  const ry = shape === "almond" ? r * 0.74 : r
  const big = mood === "victory" ? 1.08 : 1
  return (
    <g className="hwh-eye" style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <ellipse cx={cx} cy={cy} rx={r * big} ry={ry * big} fill={shape === "dark" ? color : `url(#${ids.iris})`} stroke={INK} strokeWidth="0.9" filter={glow ? `url(#${ids.glow})` : undefined} />
      {shape !== "dark" &&
        (pupil === "slit" ? (
          <ellipse cx={cx} cy={cy} rx={r * 0.24} ry={ry * 0.86} fill={INK} />
        ) : (
          <circle cx={cx} cy={cy} r={r * 0.46} fill={INK} />
        ))}
      {/* upper lid - gives every eye the same inked definition */}
      <path d={`M${cx - r * 1.05} ${cy - ry * 0.2} Q${cx} ${cy - ry * 1.35} ${cx + r * 1.05} ${cy - ry * 0.2}`} stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <circle cx={cx - r * 0.32} cy={cy - ry * 0.36} r={r * 0.28} fill="#fff" opacity="0.95" />
      <circle cx={cx + r * 0.3} cy={cy + ry * 0.3} r={r * 0.12} fill="#fff" opacity="0.75" />
      {mood === "victory" && <Sparkle x={cx + r * 0.05} y={cy - ry * 0.05} s={r * 0.42} fill="#fff" />}
      {fierce && (
        <path d={`M${cx - r * 1.2 * side} ${cy - ry * 1.5} L${cx + r * 1.1 * side} ${cy - ry * 0.95}`} stroke={INK} strokeWidth="2" strokeLinecap="round" />
      )}
    </g>
  )
}

function Eyes({ at, ...rest }) {
  return (
    <g className="hwh-eyes">
      <Eye cx={at[0]} cy={at[1]} side={-1} {...rest} />
      <Eye cx={at[2]} cy={at[3]} side={1} {...rest} />
    </g>
  )
}

// ---------------------------------------------------------------- mouths

function Mouth({ x, y, mood, style = "smile" }) {
  if (mood === "joy" || mood === "victory") {
    const w = mood === "victory" ? 7 : 6
    const h = mood === "victory" ? 9 : 7.5
    return (
      <g>
        <path d={`M${x - w} ${y} Q${x} ${y + h} ${x + w} ${y} Z`} fill="#5a1f22" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        <ellipse cx={x} cy={y + h * 0.62} rx={w * 0.5} ry={h * 0.22} fill="#e2777a" />
        {mood === "victory" && (
          <>
            <path d={`M${x - w * 0.62} ${y} L${x - w * 0.45} ${y + 2.4} L${x - w * 0.28} ${y} Z`} fill="#fff" />
            <path d={`M${x + w * 0.28} ${y} L${x + w * 0.45} ${y + 2.4} L${x + w * 0.62} ${y} Z`} fill="#fff" />
          </>
        )}
      </g>
    )
  }
  if (mood === "hurt") {
    return <path d={`M${x - 6} ${y + 2} L${x - 4} ${y} L${x - 2} ${y + 2} L${x} ${y} L${x + 2} ${y + 2} L${x + 4} ${y} L${x + 6} ${y + 2}`} stroke={INK} strokeWidth="1.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
  }
  if (mood === "defeat") {
    return <path d={`M${x - 5} ${y + 3} Q${x} ${y - 1} ${x + 5} ${y + 3}`} stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
  }
  if (style === "w") {
    return <path d={`M${x - 5} ${y} Q${x - 2.5} ${y + 3.2} ${x} ${y} Q${x + 2.5} ${y + 3.2} ${x + 5} ${y}`} stroke={INK} strokeWidth="1.3" fill="none" strokeLinecap="round" />
  }
  if (style === "grin") {
    return (
      <g>
        <path d={`M${x - 7} ${y} Q${x} ${y + 7} ${x + 7} ${y} Q${x} ${y + 2.5} ${x - 7} ${y} Z`} fill="#5a1f22" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
        <path d={`M${x - 8} ${y - 1} Q${x - 7} ${y} ${x - 7.5} ${y + 1.5} M${x + 8} ${y - 1} Q${x + 7} ${y} ${x + 7.5} ${y + 1.5}`} stroke={INK} strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (style === "smirk") {
    return <path d={`M${x - 5} ${y + 1} Q${x + 1} ${y + 3.4} ${x + 5} ${y - 1.2}`} stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
  }
  if (style === "fang") {
    return (
      <g>
        <path d={`M${x - 6} ${y + 1} Q${x} ${y + 3} ${x + 6} ${y + 1}`} stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d={`M${x - 4} ${y + 1.6} L${x - 3} ${y + 4.6} L${x - 2} ${y + 2}`} fill="#fff" stroke={INK} strokeWidth="0.5" />
        <path d={`M${x + 2} ${y + 2} L${x + 3} ${y + 4.6} L${x + 4} ${y + 1.6}`} fill="#fff" stroke={INK} strokeWidth="0.5" />
      </g>
    )
  }
  if (style === "flat") {
    return <path d={`M${x - 5} ${y + 1} Q${x} ${y + 2.2} ${x + 5} ${y + 1}`} stroke={INK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
  }
  return <path d={`M${x - 5} ${y + 0.5} Q${x} ${y + 4.5} ${x + 5} ${y + 0.5}`} stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
}

// ---------------------------------------------------------------- shared bits

function Sparkle({ x, y, s, fill = "#ffe7a0", className }) {
  return <path className={className} d={`M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z`} fill={fill} />
}

// Mood dressing drawn on top of every hero, at the hero's own face anchors.
function MoodLayer({ mood, face }) {
  const [lx, ly, rx, ry] = face.eyes
  if (mood === "joy") {
    return (
      <g opacity="0.55">
        <ellipse cx={lx - 2} cy={ly + 7} rx="4.2" ry="2.4" fill="#ff8a8a" />
        <ellipse cx={rx + 2} cy={ry + 7} rx="4.2" ry="2.4" fill="#ff8a8a" />
      </g>
    )
  }
  if (mood === "hurt") {
    return (
      <g>
        <path d={`M${rx + 7} ${ry + 3} l6 -6 M${rx + 9} ${ry + 7} l6 -6 M${rx + 11} ${ry + 11} l5 -5`} stroke="#d8323a" strokeWidth="1.8" strokeLinecap="round" />
        <path className="hwh-sweat" d={`M${lx - 9} ${ly - 8} q-2.6 4 0 5.2 q2.6 -1.2 0 -5.2 Z`} fill="#bfe6ff" stroke="#5a8ab0" strokeWidth="0.5" />
      </g>
    )
  }
  if (mood === "victory") {
    return (
      <g className="hwh-sparkles">
        <Sparkle x={14} y={20} s={4.5} />
        <Sparkle x={86} y={16} s={5.5} />
        <Sparkle x={88} y={44} s={3.2} />
        <Sparkle x={12} y={46} s={3} />
      </g>
    )
  }
  if (mood === "defeat") {
    return <path d={`M${rx + 2} ${ry + 3} q-2.2 4.2 0 6 q2.2 -1.8 0 -6 Z`} fill="#bfe6ff" stroke="#5a8ab0" strokeWidth="0.5" />
  }
  return null
}

// Soft top-left light over the head - the shared "painted" sheen.
function Sheen({ cx, cy, rx, ry }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" opacity="0.16" />
}

const ink = { stroke: INK, strokeWidth: 1.1, strokeLinejoin: "round" }

// ---------------------------------------------------------------- heroes

function Cat({ p, mood, ids }) {
  const droop = mood === "defeat"
  return {
    face: { eyes: [40, 51, 60, 51] },
    back: (
      <g className="hwh-tail" style={{ transformOrigin: "80px 100px" }}>
        <path d="M76 104 C92 96 96 76 88 62 C84 54 86 46 92 42" stroke={INK} strokeWidth="11" fill="none" strokeLinecap="round" />
        <path d="M76 104 C92 96 96 76 88 62 C84 54 86 46 92 42" stroke={`url(#${ids.fur})`} strokeWidth="9" fill="none" strokeLinecap="round" />
        <path d="M89 63 l6 -2 M87 75 l7 0 M86 87 l6 3" stroke={p.stripe} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M88 47 C88 44 90 42 92 42" stroke={p.cream} strokeWidth="8" fill="none" strokeLinecap="round" />
      </g>
    ),
    body: (
      <g>
        <ellipse cx="50" cy="102" rx="32" ry="25" fill={`url(#${ids.fur})`} {...ink} />
        <ellipse cx="50" cy="98" rx="14" ry="15" fill={p.cream} />
        <path d="M27 79 Q50 92 73 79 L75 86 Q50 100 25 86 Z" fill={p.scarf} {...ink} />
        <path d="M58 88 L67 100 L57 99 Z" fill={p.scarfDark} {...ink} />
        <path d="M30 83 Q50 94 70 83" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2" fill="none" />
      </g>
    ),
    head: (
      <g>
        <g className="hwh-ear-l" style={{ transformOrigin: "36px 36px" }} transform={droop ? "rotate(-16 36 36)" : undefined}>
          <path d="M28 40 L23 11 L46 30 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M30 36 L26 18 L41 31 Z" fill={p.earInner} />
        </g>
        <g className="hwh-ear-r" style={{ transformOrigin: "64px 36px" }} transform={droop ? "rotate(16 64 36)" : undefined}>
          <path d="M72 40 L77 11 L54 30 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M70 36 L74 18 L59 31 Z" fill={p.earInner} />
        </g>
        <path d="M50 26 C66 26 76 36 77 48 L83 54 L76 57 C74 69 63 77 50 77 C37 77 26 69 24 57 L17 54 L23 48 C24 36 34 26 50 26 Z" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M50 28 L50 37 M44 29.5 L45 36 M56 29.5 L55 36 M25 51 L33 52.5 M25.5 56 L33 56.5 M75 51 L67 52.5 M74.5 56 L67 56.5" stroke={p.stripe} strokeWidth="2.6" strokeLinecap="round" filter={p.glow ? `url(#${ids.glow})` : undefined} />
        <ellipse cx="50" cy="65" rx="14" ry="10.5" fill={p.cream} />
        <Sheen cx={42} cy={36} rx={13} ry={7} />
        <path d="M47 60 L53 60 L50 63.6 Z" fill={p.nose} stroke={INK} strokeWidth="0.7" strokeLinejoin="round" />
        <path d="M38 64 L17 60 M38 66.5 L18 67 M62 64 L83 60 M62 66.5 L82 67" stroke={p.cream} strokeOpacity="0.8" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    ),
    eyes: { at: [40, 51, 60, 51], r: 6.6, color: p.eye, shape: "round", pupil: "slit", glow: p.glow },
    mouth: { x: 50, y: 63.8, style: "w" },
  }
}

function Reindeer({ p, mood, ids }) {
  const droop = mood === "defeat"
  const antlerL = "M41 38 C36 28 31 20 23 11 M32 22 L22 23 M28 17 C26 11 28 6 32 2 M37 31 C30 33 22 32 15 27 M24 30 L18 34"
  const antlerR = "M59 38 C64 28 69 20 77 11 M68 22 L78 23 M72 17 C74 11 72 6 68 2 M63 31 C70 33 78 32 85 27 M76 30 L82 34"
  return {
    face: { eyes: [41, 56, 59, 56] },
    back: (
      <g className="hwh-antlers" filter={p.glow ? `url(#${ids.glow})` : undefined}>
        <path d={antlerL} stroke={INK} strokeWidth="6.4" fill="none" strokeLinecap="round" />
        <path d={antlerR} stroke={INK} strokeWidth="6.4" fill="none" strokeLinecap="round" />
        <path d={antlerL} stroke={`url(#${ids.antler})`} strokeWidth="4.4" fill="none" strokeLinecap="round" />
        <path d={antlerR} stroke={`url(#${ids.antler})`} strokeWidth="4.4" fill="none" strokeLinecap="round" />
      </g>
    ),
    body: (
      <g className="hwh-breath" style={{ transformOrigin: "50px 100px" }}>
        <ellipse cx="50" cy="104" rx="34" ry="24" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M30 86 Q34 92 38 87 Q42 94 46 88 Q50 95 54 88 Q58 94 62 87 Q66 92 70 86 L68 100 L32 100 Z" fill={p.furLight} />
        <path d="M28 82 Q50 94 72 82 L73 89 Q50 101 27 89 Z" fill={p.scarf} {...ink} />
        <circle cx="50" cy="93.5" r="4.4" fill="#d6dde2" {...ink} />
        <circle className="hwh-gem" cx="50" cy="93.5" r="2.4" fill={p.accent} filter={`url(#${ids.glow})`} />
      </g>
    ),
    head: (
      <g>
        <g transform={droop ? "rotate(-22 34 46)" : undefined}>
          <path d="M34 46 C25 39 15 40 9 45 C15 52 26 52 35 50 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M31 47 C24 43 17 44 13 46 C18 49 25 49 31 48.5 Z" fill="#e7c4c0" opacity="0.8" />
        </g>
        <g transform={droop ? "rotate(22 66 46)" : undefined}>
          <path d="M66 46 C75 39 85 40 91 45 C85 52 74 52 65 50 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M69 47 C76 43 83 44 87 46 C82 49 75 49 69 48.5 Z" fill="#e7c4c0" opacity="0.8" />
        </g>
        <path d="M50 35 C62 35 68 43 67 53 C66 63 63 72 61 79 C59 85 55 88 50 88 C45 88 41 85 39 79 C37 72 34 63 33 53 C32 43 38 35 50 35 Z" fill={`url(#${ids.fur})`} {...ink} />
        <ellipse cx="50" cy="78" rx="10.5" ry="9.5" fill={p.muzzle} />
        <Sheen cx={44} cy={42} rx={10} ry={6} />
        <path className="hwh-gem" d="M50 41 L52.4 44.5 L50 48 L47.6 44.5 Z" fill={p.accent} opacity="0.9" filter={`url(#${ids.glow})`} />
        <ellipse cx="50" cy="77" rx="6" ry="4" fill={p.nose} stroke={INK} strokeWidth="0.8" />
        <ellipse cx="48.4" cy="75.8" rx="1.8" ry="1" fill="#fff" opacity="0.5" />
      </g>
    ),
    eyes: { at: [41, 56, 59, 56], r: 4.6, color: p.eye, shape: "dark" },
    mouth: { x: 50, y: 82.5, style: "grin" },
  }
}

function Fox({ p, mood, ids }) {
  const droop = mood === "defeat"
  return {
    face: { eyes: [39, 50, 61, 50] },
    back: (
      <g className="hwh-tail" style={{ transformOrigin: "26px 100px" }}>
        <path d="M30 104 C8 98 2 74 14 62 C20 70 22 84 36 96 Z" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M14 62 C11 66 10 71 11 75 C14 72 16 68 18 66 Z" fill={p.cream} />
      </g>
    ),
    body: (
      <g>
        <ellipse cx="50" cy="103" rx="33" ry="25" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M38 84 L50 100 L62 84 Q50 90 38 84 Z" fill={p.cream} />
        <path d="M22 86 L30 82 L80 104 L70 108 Z" fill={p.strap} {...ink} />
        <g className="hwh-amulet">
          <circle cx="50" cy="93" r="7.4" fill={p.brass} {...ink} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect key={a} x="48.8" y="84.2" width="2.4" height="2.6" fill={p.brass} stroke={INK} strokeWidth="0.5" transform={`rotate(${a} 50 93)`} />
          ))}
          <circle className="hwh-gem" cx="50" cy="93" r="4" fill={p.gem} filter={`url(#${ids.glow})`} />
          <circle cx="48.6" cy="91.6" r="1.2" fill="#fff" opacity="0.8" />
        </g>
        <path d="M27 84 q-3 -5 1 -7 q2 4 4 3 q1 -4 4 -3 q0 4 -3 7 Z" fill={p.moss} />
        <path d="M72 101 q2 -6 7 -6 q-1 5 -7 6 Z" fill={p.moss} />
      </g>
    ),
    head: (
      <g>
        <g transform={droop ? "rotate(-18 34 40)" : undefined} className="hwh-ear-l" style={{ transformOrigin: "34px 40px" }}>
          <path d="M30 44 L22 7 L47 32 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M31 39 L25.5 15 L42 32 Z" fill={p.earInner} />
          <path d="M22 7 L24.6 18.6 L29.6 15 Z" fill={p.earTip} />
        </g>
        <g transform={droop ? "rotate(18 66 40)" : undefined} className="hwh-ear-r" style={{ transformOrigin: "66px 40px" }}>
          <path d="M70 44 L78 7 L53 32 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M69 39 L74.5 15 L58 32 Z" fill={p.earInner} />
          <path d="M78 7 L75.4 18.6 L70.4 15 Z" fill={p.earTip} />
        </g>
        <path d="M50 28 C64 28 74 36 76 46 L85 58 C77 62 69 67 61 76 L50 86 L39 76 C31 67 23 62 15 58 L24 46 C26 36 36 28 50 28 Z" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M15 58 C24 54 34 56 42 62 Q50 66 58 62 C66 56 76 54 85 58 C77 62 69 67 61 76 L50 86 L39 76 C31 67 23 62 15 58 Z" fill={p.cream} {...ink} />
        {p.plated && (
          <g>
            <path d="M34 34 Q50 26 66 34 L62 44 Q50 40 38 44 Z" fill={p.brass} {...ink} />
            <path d="M50 29 L50 41" stroke={INK} strokeWidth="0.8" />
            {[[38, 38], [62, 38], [46, 33], [54, 33]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.1" fill="#7a5a2a" />)}
            <path d="M60 32 q3 -4 7 -3 q-2 4 -7 3 Z" fill={p.moss} />
          </g>
        )}
        {!p.plated && <Sheen cx={42} cy={37} rx={12} ry={6} />}
        <ellipse cx="50" cy="79.5" rx="3.6" ry="2.6" fill={p.nose} />
        <ellipse cx="49" cy="78.7" rx="1.2" ry="0.7" fill="#fff" opacity="0.5" />
      </g>
    ),
    eyes: { at: [39, 50, 61, 50], r: 6, color: p.eye, shape: "almond", pupil: "slit", glow: p.plated },
    mouth: { x: 50, y: 82, style: "smirk" },
  }
}

function Wolf({ p, mood, ids }) {
  const droop = mood === "defeat"
  return {
    face: { eyes: [40, 49, 60, 49] },
    back: null,
    body: (
      <g>
        <ellipse cx="50" cy="104" rx="35" ry="25" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M18 92 L24 80 L28 88 L33 78 L38 87 L44 79 L50 88 L56 79 L62 87 L67 78 L72 88 L76 80 L82 92 Z" fill={p.furDark} {...ink} />
        <g className="hwh-chain" filter={p.glow ? `url(#${ids.glow})` : undefined}>
          {[26, 34, 42, 50, 58, 66].map((x, i) => (
            <ellipse key={x} cx={x} cy={92 + (i % 2) * 1.5 + Math.abs(x - 46) * 0.12} rx="4.2" ry="2.6" fill="none" stroke={p.chainDark} strokeWidth="2.6" />
          ))}
          {[26, 34, 42, 50, 58, 66].map((x, i) => (
            <ellipse key={`h${x}`} cx={x} cy={92 + (i % 2) * 1.5 + Math.abs(x - 46) * 0.12} rx="4.2" ry="2.6" fill="none" stroke={p.chain} strokeWidth="1.3" />
          ))}
          <path d="M70 94 l4 6 l-2 3 M73 100 l3 1" stroke={p.chain} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
        <path className="hwh-rune" d="M50 98 L50 108 M50 100 L55 96 M50 104 L45 100" stroke={p.accent} strokeWidth="1.8" strokeLinecap="round" filter={`url(#${ids.glow})`} />
      </g>
    ),
    head: (
      <g>
        <g transform={droop ? "rotate(-20 36 36)" : undefined}>
          <path d="M30 40 L27 12 L46 29 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M31 36 L29 19 L41 30 Z" fill={p.furDark} />
        </g>
        <g transform={droop ? "rotate(20 64 36)" : undefined}>
          <path d="M70 40 L73 12 L54 29 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M69 36 L71 19 L59 30 Z" fill={p.furDark} />
        </g>
        <path d="M50 25 C64 25 74 33 76 45 L84 50 L78 55 L84 60 C78 63 72 64 66 67 L60 79 L50 85 L40 79 L34 67 C28 64 22 63 16 60 L22 55 L16 50 L24 45 C26 33 36 25 50 25 Z" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M37 29 Q50 22 63 29 L57 41 Q50 45 43 41 Z" fill={p.furDark} />
        <path d="M33 66 Q42 58 50 60 Q58 58 67 66 L60 79 L50 85 L40 79 Z" fill={p.cream} {...ink} />
        <path d="M24 56 L33 58 M76 56 L67 58" stroke={p.cream} strokeWidth="2" strokeLinecap="round" />
        <Sheen cx={42} cy={34} rx={11} ry={5} />
        <path d="M34 39 L45 60" stroke={p.scar} strokeWidth="1.6" strokeLinecap="round" />
        <path d="M46.5 75 Q50 73 53.5 75 Q53 79 50 80 Q47 79 46.5 75 Z" fill={p.nose} />
      </g>
    ),
    eyes: { at: [40, 49, 60, 49], r: 5.4, color: p.eye, shape: "almond", pupil: "round", glow: p.glow, fierce: mood !== "joy" && mood !== "defeat" },
    mouth: { x: 50, y: 80.5, style: "fang" },
  }
}

function Lynx({ p, mood, ids }) {
  const droop = mood === "defeat"
  return {
    face: { eyes: [40, 50, 60, 50] },
    back: (
      <g className="hwh-smoke" opacity="0.5" filter={`url(#${ids.soft})`}>
        <path d="M12 98 C6 86 18 78 11 66 C7 58 14 52 11 42" stroke="#b0a99c" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.55" />
        <path d="M89 100 C95 88 84 80 91 68 C95 60 88 54 91 44" stroke="#b0a99c" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.45" />
      </g>
    ),
    body: (
      <g>
        <ellipse cx="50" cy="104" rx="33" ry="24" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M14 104 C18 86 30 80 50 82 C70 80 82 86 86 104 Z" fill={p.cloak} {...ink} />
        <path d="M14 104 C18 86 30 80 50 82 C70 80 82 86 86 104" stroke={p.ember} strokeWidth="1.6" fill="none" strokeDasharray="3 2.4" filter={`url(#${ids.glow})`} className="hwh-ember-edge" />
        <path d="M44 88 Q50 84 56 88 Q54 95 50 97 Q46 95 44 88 Z" fill={p.blight} {...ink} />
        <path d="M50 87 L50 96" stroke={INK} strokeWidth="0.7" />
      </g>
    ),
    head: (
      <g>
        <g transform={droop ? "rotate(-26 36 36)" : undefined}>
          <path d="M32 40 L29 15 L45 30 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M33 36 L31 21 L41 31 Z" fill={p.furDark} />
          <path d="M29 15 L27 4" stroke={p.earTip} strokeWidth="2.6" strokeLinecap="round" filter={p.glow ? `url(#${ids.glow})` : undefined} />
        </g>
        <g transform={droop ? "rotate(26 64 36)" : undefined}>
          <path d="M68 40 L71 15 L55 30 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M67 36 L69 21 L59 31 Z" fill={p.furDark} />
          <path d="M71 15 L73 4" stroke={p.earTip} strokeWidth="2.6" strokeLinecap="round" filter={p.glow ? `url(#${ids.glow})` : undefined} />
        </g>
        <path d="M50 28 C64 28 72 36 74 46 C78 54 85 62 83 71 L73 67 L71 75 L62 70 C58 76 54 78 50 78 C46 78 42 76 38 70 L29 75 L27 67 L17 71 C15 62 22 54 26 46 C28 36 36 28 50 28 Z" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M27 67 L36 60 L38 70 M73 67 L64 60 L62 70" fill={p.cream} />
        {[[44, 33], [50, 31], [56, 33], [30, 54], [70, 54], [33, 60], [67, 60]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.6" ry="1.2" fill={p.spot} />)}
        <ellipse cx="50" cy="66" rx="10.5" ry="8.5" fill={p.cream} />
        <path d="M33 53 L28 60 M67 53 L72 60" stroke={p.spot} strokeWidth="1.6" strokeLinecap="round" />
        <Sheen cx={42} cy={36} rx={11} ry={5.5} />
        <path d="M47 61.5 L53 61.5 L50 64.6 Z" fill={p.nose} stroke={INK} strokeWidth="0.6" />
      </g>
    ),
    eyes: { at: [40, 50, 60, 50], r: 6, color: p.eye, shape: "almond", pupil: "slit", glow: true },
    mouth: { x: 50, y: 64.8, style: "smirk" },
  }
}

function Bear({ p, mood, ids }) {
  return {
    face: { eyes: [39, 52, 61, 52] },
    back: null,
    body: (
      <g>
        <ellipse cx="50" cy="104" rx="42" ry="27" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M4 100 L10 82 L24 76 L36 82 L34 100 Z" fill={`url(#${ids.stone})`} {...ink} />
        <path d="M96 100 L90 82 L76 76 L64 82 L66 100 Z" fill={`url(#${ids.stone})`} {...ink} />
        <path d="M14 84 L20 92 L18 98 M86 84 L80 92 L82 98" stroke={p.stoneDark} strokeWidth="1" fill="none" />
        {[[12, 90], [28, 80], [88, 90], [72, 80], [24, 95]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill={p.lichen} opacity="0.85" />)}
        <path className="hwh-rune" d="M22 84 L22 94 M22 86 L26 90 L22 94 M78 84 L78 94 M78 86 L74 90 L78 94" stroke={p.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" filter={`url(#${ids.glow})`} />
        <path d="M36 86 Q50 94 64 86" stroke={p.furDark} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    ),
    head: (
      <g transform={mood === "defeat" ? "rotate(4 50 60)" : undefined}>
        <circle cx="29" cy="33" r="8.5" fill={`url(#${ids.fur})`} {...ink} />
        <circle cx="29" cy="33" r="4.2" fill={p.furDark} />
        <circle cx="71" cy="33" r="8.5" fill={`url(#${ids.fur})`} {...ink} />
        <circle cx="71" cy="33" r="4.2" fill={p.furDark} />
        <path d="M50 29 C69 29 79 41 79 56 C79 71 67 81 50 81 C33 81 21 71 21 56 C21 41 31 29 50 29 Z" fill={`url(#${ids.fur})`} {...ink} />
        <ellipse cx="50" cy="67" rx="14" ry="10.5" fill={p.muzzle} {...ink} />
        <Sheen cx={41} cy={38} rx={13} ry={6} />
        <path className="hwh-rune" d="M50 36 L50 44 M47 38 L53 42 M53 38 L47 42" stroke={p.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
        <path d="M44 61 Q50 57.5 56 61 Q55 65.5 50 66.5 Q45 65.5 44 61 Z" fill={p.nose} />
        <ellipse cx="48" cy="60.6" rx="1.8" ry="0.8" fill="#fff" opacity="0.4" />
      </g>
    ),
    eyes: { at: [39, 52, 61, 52], r: 3.6, color: p.eye, shape: "dark" },
    mouth: { x: 50, y: 70.5, style: "flat" },
  }
}

function Hare({ p, mood, ids }) {
  const droop = mood === "defeat"
  return {
    face: { eyes: [39, 56, 61, 56] },
    back: (
      <g>
        <g className="hwh-ear-l" style={{ transformOrigin: "44px 40px" }} transform={droop ? "rotate(-55 44 40)" : undefined}>
          <path d="M41 40 C34 24 32 9 37 2 C44 6 47 22 47 38 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M41.5 34 C37 22 36 12 38.4 7 C42 11 44 22 44.5 33 Z" fill={p.earInner} />
          <path d="M37 2 C36.6 5 37 7 38 8.6 C40 7 41.4 5.4 41.6 4 C40 3 38.6 2.2 37 2 Z" fill={p.earTip} />
        </g>
        <g className="hwh-ear-r" style={{ transformOrigin: "56px 40px" }} transform={droop ? "rotate(55 56 40)" : undefined}>
          <path d="M53 38 C55 22 60 8 67 3 C71 10 65 26 59 40 Z" fill={`url(#${ids.fur})`} {...ink} />
          <path d="M56 34 C58 23 62 13 65.6 8.6 C67 15 62.6 25 58.6 34 Z" fill={p.earInner} />
          <path d="M67 3 C65.6 4.2 64.4 6 63.8 7.6 C65.6 8.6 67.4 8.8 68.6 8.4 C68.6 6.4 68 4.4 67 3 Z" fill={p.earTip} />
        </g>
      </g>
    ),
    body: (
      <g className="hwh-breath" style={{ transformOrigin: "50px 100px" }}>
        <ellipse cx="50" cy="104" rx="31" ry="23" fill={`url(#${ids.fur})`} {...ink} />
        <path d="M17 104 C20 88 32 84 50 85 C68 84 80 88 83 104 Z" fill={p.cloak} {...ink} />
        <path d="M50 85 L50 104" stroke={p.cloakDark} strokeWidth="1.2" />
        <path d="M44 88 Q50 82 56 88 Q50 96 44 88 Z" fill={p.leaf} {...ink} />
        <path d="M76 90 q1 -8 6 -11 M80 83 q4 -2 6 0 q-3 3 -6 0 M78 87 q-4 -3 -6 -1 q3 3 6 1" stroke={p.leafDark} fill={p.leaf} strokeWidth="0.9" />
      </g>
    ),
    head: (
      <g>
        <path d="M50 37 C64 37 72 47 72 59 C72 71 62 79 50 79 C38 79 28 71 28 59 C28 47 36 37 50 37 Z" fill={`url(#${ids.fur})`} {...ink} />
        <ellipse cx="43.5" cy="68" rx="8" ry="6.2" fill={p.cream} />
        <ellipse cx="56.5" cy="68" rx="8" ry="6.2" fill={p.cream} />
        <Sheen cx={43} cy={44} rx={10} ry={5} />
        <g className="hwh-crown" filter={p.glow ? `url(#${ids.glow})` : undefined}>
          {[[33, 44, -50], [38, 40, -30], [44, 38, -10], [56, 38, 10], [62, 40, 30], [67, 44, 50]].map(([x, y, a]) => (
            <ellipse key={x} cx={x} cy={y} rx="4.4" ry="2.3" transform={`rotate(${a - 90} ${x} ${y})`} fill={p.leaf} stroke={p.leafDark} strokeWidth="0.8" />
          ))}
          <circle cx="50" cy="37.6" r="2.4" fill={p.berry} stroke={INK} strokeWidth="0.6" />
          <circle cx="46.6" cy="38.6" r="1.7" fill={p.berry} stroke={INK} strokeWidth="0.5" />
          <circle cx="53.4" cy="38.6" r="1.7" fill={p.berry} stroke={INK} strokeWidth="0.5" />
        </g>
        <path d="M47.6 63 Q50 61.6 52.4 63 L50 65.4 Z" fill={p.nose} />
        <path d="M50 65.4 L50 67.4" stroke={INK} strokeWidth="0.9" />
        <path d="M41 67 L26 64.5 M41 69 L27 70 M59 67 L74 64.5 M59 69 L73 70" stroke={p.furDark} strokeWidth="0.6" strokeLinecap="round" />
      </g>
    ),
    eyes: { at: [39, 56, 61, 56], r: 5.4, color: p.eye, shape: "dark" },
    mouth: { x: 50, y: 67.2, style: "smile" },
  }
}

const DRAW = { cat: Cat, reindeer: Reindeer, fox: Fox, wolf: Wolf, lynx: Lynx, bear: Bear, hare: Hare }

// "battle" crops in on the face so the token still reads at board size.
const VIEWBOX = { portrait: "0 0 100 100", round: "0 0 100 100", battle: "8 10 84 84" }

export default function HeroAvatar({ heroId, variant = "portrait", mood = "neutral", skin = "default", className, title }) {
  const raw = useId()
  const hero = HEROES[heroId]
  if (!hero) return null
  const s = skinFor(heroId, skin)
  const p = s.palette
  const uid = `hwh${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`
  const ids = {
    fur: `${uid}-fur`, iris: `${uid}-iris`, glow: `${uid}-glow`, bg: `${uid}-bg`, clip: `${uid}-clip`,
    antler: `${uid}-antler`, soft: `${uid}-soft`, stone: `${uid}-stone`, vig: `${uid}-vig`,
  }
  const parts = DRAW[hero.kind]({ p, mood, ids })
  const framed = variant !== "battle"
  return (
    <svg
      viewBox={VIEWBOX[variant] || VIEWBOX.portrait}
      className={["hwh-avatar", className].filter(Boolean).join(" ")}
      data-hero={heroId}
      data-variant={variant}
      data-mood={mood}
      data-skin={skin}
      role="img"
      aria-label={title || `${s.name}${mood !== "neutral" ? ` (${mood})` : ""}`}
    >
      <defs>
        <linearGradient id={ids.fur} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={p.furLight} />
          <stop offset="0.55" stopColor={p.fur} />
          <stop offset="1" stopColor={p.furDark} />
        </linearGradient>
        <radialGradient id={ids.iris} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.35" stopColor={p.eye} />
          <stop offset="1" stopColor={INK} stopOpacity="0.85" />
        </radialGradient>
        {p.antler && (
          <linearGradient id={ids.antler} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.antler} />
            <stop offset="1" stopColor={p.antlerDark} />
          </linearGradient>
        )}
        {p.stone && (
          <linearGradient id={ids.stone} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={p.stone} />
            <stop offset="1" stopColor={p.stoneDark} />
          </linearGradient>
        )}
        <radialGradient id={ids.bg} cx="0.42" cy="0.38" r="0.8">
          <stop offset="0" stopColor={p.bgInner} />
          <stop offset="1" stopColor={p.bgOuter} />
        </radialGradient>
        <radialGradient id={ids.vig} cx="0.5" cy="0.5" r="0.7">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <filter id={ids.soft} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <filter id={ids.glow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {variant === "round" && (
          <clipPath id={ids.clip}>
            <circle cx="50" cy="50" r="50" />
          </clipPath>
        )}
      </defs>
      <g clipPath={variant === "round" ? `url(#${ids.clip})` : undefined}>
        {framed && (
          <>
            <rect x="0" y="0" width="100" height="100" fill={`url(#${ids.bg})`} />
            <ellipse cx="50" cy="104" rx="46" ry="16" fill="#fff" opacity="0.06" />
            {mood === "hurt" && <rect x="0" y="0" width="100" height="100" fill="#c0282e" opacity="0.18" />}
            {mood === "victory" && <circle cx="50" cy="44" r="40" fill="#ffd77a" opacity="0.14" />}
          </>
        )}
        <g className="hwh-figure">
          {parts.back}
          {parts.body}
          <g className="hwh-head" style={{ transformOrigin: "50px 70px" }}>
            {parts.head}
            <Eyes {...parts.eyes} mood={mood} ids={ids} />
            <Mouth {...parts.mouth} mood={mood} />
            <MoodLayer mood={mood} face={parts.face} />
          </g>
        </g>
        {framed && <rect x="0" y="0" width="100" height="100" fill={`url(#${ids.vig})`} pointerEvents="none" />}
      </g>
    </svg>
  )
}
