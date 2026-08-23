import { motion } from "framer-motion"
import { CardGlyph, formatPowerLabel } from "./cardArt"

// Every status badge used to be plain text ("Poison 3", "Taunt 1") -
// no icon, no color, all identical .hw-badge styling regardless of
// whether it helps or hurts the unit wearing it. Reuses the same
// generic glyphs the rest of the game already draws from rather than
// commissioning new art per status, and the color tokens every other
// UI element (intent display, ResultOverlay) already uses, so a buff
// reads green/warm and a debuff reads as the same "curse" red the
// enemy-debuff intent already uses - one glance, not a read.
const STATUS_DISPLAY = {
  strength: { icon: "sword", color: "var(--hw-ember)" },
  weak: { icon: "root", color: "var(--hw-curse)" },
  vulnerable: { icon: "rune", color: "var(--hw-curse)" },
  woundedFury: { icon: "flame", color: "var(--hw-ember)" },
  poison: { icon: "leaf", color: "var(--hw-curse)" },
  stun: { icon: "spark", color: "var(--hw-curse)" },
  taunt: { icon: "shield", color: "var(--hw-rune)" },
  execute: { icon: "sword", color: "var(--hw-hp)" },
  revive: { icon: "heart", color: "var(--hw-moss)" },
  ward: { icon: "shield", color: "var(--hw-rune)" },
  shatter: { icon: "sword", color: "var(--hw-rune)" },
  // Regen (effects.js's tickRegen, Fernwake) - Poison's mirror on the
  // support side, same heart-icon/moss-color language Revive already
  // uses for "a good status," keeping the icon-first rule intact for
  // this newest status too rather than letting it fall back to
  // unstyled plain text.
  regen: { icon: "heart", color: "var(--hw-moss)" },
  // Chain (Cascading Claw/Cascading Wound, items.js/relics.js) - the
  // newest mechanic to gain an item/relic-granted `applyBuff` stack
  // (previously chainDamage lived only as a raw def field baked into
  // Rimefang/Grimtusk/Foxfire's own kit, never a real power a badge
  // could show). Same offensive-buff color as Strength/Wounded Fury.
  chainDamage: { icon: "sword", color: "var(--hw-ember)" },
  // Spore Spread (Fungal Spore Sac/Mycotic Bloom, items.js/relics.js) -
  // a boolean flag (the mechanic only ever cares whether it's present,
  // not its stack count) that makes this unit's own Poison applications
  // seed onto a second enemy too. Same leaf/curse language Poison
  // itself already uses - it reads as "this unit's poison is special,"
  // not a separate unrelated status, which is exactly what it is.
  sporeSpread: { icon: "leaf", color: "var(--hw-curse)" },
}

// Sword/shield icons instead of "Attack 8"/"Guard 8" text - the point
// is to be able to tell what's about to happen without reading.
function intentDisplay(intent) {
  if (!intent) return null
  if (intent.type === "attack") return { icon: "sword", amount: intent.amount, className: "hw-intent--attack" }
  if (intent.type === "block") return { icon: "shield", amount: intent.amount, className: "hw-intent--block" }
  if (intent.type === "heal") return { icon: "heart", amount: intent.amount, className: "hw-intent--heal" }
  if (intent.type === "aoe")
    return { icon: null, text: `Strikes the whole squad for ${intent.amount}`, className: "hw-intent--attack" }
  if (intent.type === "debuff")
    return { icon: null, text: `${formatPowerLabel(intent.id)} +${intent.amount}`, className: "hw-intent--debuff" }
  if (intent.type === "sunder")
    return { icon: null, text: "Strips a positive status", className: "hw-intent--debuff" }
  if (intent.type === "cleanse")
    return { icon: null, text: "Cleanses a negative status", className: "hw-intent--heal" }
  return null
}

// One enemy piece as it renders inside a BattleGrid square. Reuses the
// same visual language EnemyPanel used to own (glyph/HP/intent/power
// badges) at grid-cell scale, plus a shield badge when the piece is
// currently protected from ordinary single-target cards.
export default function EnemyPieceCard({ enemy, art, shielded, summoned, highlighted, onClick, side = "enemy" }) {
  const dead = enemy.hp <= 0
  const intent = intentDisplay(enemy.intent)
  const hpPct = Math.max(0, Math.round((enemy.hp / enemy.maxHp) * 100))
  const powerEntries = Object.entries(enemy.powers || {}).filter(([, v]) => v)

  return (
    // Marc: "peli on liian yksinkertaisen näköinen se tarvii lisää
    // animaatioita ja visuaalisuutta" (the game looks too simple, it
    // needs more animations) - every piece used to pop onto the grid
    // instantly with zero motion the moment a battle started. initial/
    // animate only replay on mount (React key/position staying stable
    // across a fight means this fires exactly once per piece, not on
    // every HP-changing re-render), so this is a real entrance, not a
    // per-hit flicker layered on top of the existing hit-flash.
    <motion.div
      className="hw-piece"
      data-side={side}
      data-dead={dead}
      data-highlighted={highlighted}
      data-unit-id={enemy.id}
      onClick={!dead && onClick ? onClick : undefined}
      initial={{ opacity: 0, scale: 0.6, y: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {shielded && !dead && (
        <span className="hw-badge hw-shield-badge" title="Shielded - ordinary attacks can't reach this piece">
          🛡
        </span>
      )}
      {summoned && !dead && (
        <span className="hw-badge hw-summon-badge" title="Summoned - a bonus companion, not a recruited unit">
          <CardGlyph name="wolf" className="hw-intent-glyph" /> Summoned
        </span>
      )}
      <CardGlyph name={art} className="hw-piece-glyph" />
      <div className="hw-piece-name">{enemy.name}</div>
      {!dead && (
        <>
          <div className="hw-hp-row">
            <div className="hw-hp-bar-track">
              <div className="hw-hp-bar-fill" style={{ width: `${hpPct}%` }} />
            </div>
            <span className="hw-hp-label">{enemy.hp}/{enemy.maxHp}</span>
          </div>
          {intent && (
            <div className={`hw-intent ${intent.className}`}>
              {intent.icon ? (
                <>
                  <CardGlyph name={intent.icon} className="hw-intent-glyph" />
                  {intent.amount}
                </>
              ) : (
                intent.text
              )}
            </div>
          )}
          {enemy.block > 0 && <span className="hw-badge hw-badge--block">Block {enemy.block}</span>}
          {powerEntries.length > 0 && (
            <div className="hw-powers">
              {powerEntries.map(([id, amount]) => {
                const display = STATUS_DISPLAY[id]
                return (
                  <span key={id} className="hw-badge" style={display ? { color: display.color, borderColor: display.color } : undefined}>
                    {display && <CardGlyph name={display.icon} className="hw-intent-glyph" />}
                    {formatPowerLabel(id)} {amount}
                  </span>
                )
              })}
            </div>
          )}
        </>
      )}
      {dead && <div className="hw-piece-dead">Defeated</div>}
    </motion.div>
  )
}
