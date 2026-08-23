// Heartwood Trial - unit Tribes and squad synergies, Hearthstone
// Battlegrounds/TFT-style ("if you have N units of the same tribe
// deployed, the whole squad gets a bonus"). Kept as its own file
// rather than adding a `tribes` field to every units.js entry by hand
// (66 of them) - a lookup table here is just as functional and far
// safer to author/review than 66 individual inline edits to units.js,
// and keeps this whole feature additive/removable on its own, same
// "plugin over core" spirit as everything else layered onto the base
// autobattler (Rally, Chain, Shatter, etc. all followed the same
// "new file/new field, zero changes to existing unit defs" shape).
//
// Taxonomy is new, not borrowed from Hearthstone's Beast/Undead/Mech -
// it groups the roster's own already-established mechanical identities
// (see units.js's own comments citing Marc's 12 base classes) into 6
// forest/tarot-flavored tribes:
//   Warden - stone/bark protectors (Taunt, Ward, heavy turnStart Block)
//   Fang   - quick strikers (Haste, Chain, Execute, Shatter)
//   Root   - curse-casters (Poison/Weak/Vulnerable/Stun appliers)
//   Grove  - menders & buffers (heal, rallyHeal, rallyAdjacent auras, Cleanse)
//   Spirit - ephemeral/otherworldly (self-Ward-as-evasion, Revive, summon)
//   Thorn  - raw brutes (no distinguishing status mechanic, just damage)
// Every one of the 66 recruitable base units got exactly one tag, by
// its own dominant mechanic first, its role only as a last-resort
// tiebreaker for the many "plain attacker, no gimmick" units (which
// default to Thorn - that tribe is deliberately the roster's largest,
// same way "no gimmick" is the most common unit shape overall).
export const TRIBES = {
  warden: { id: "warden", name: "Warden", icon: "shield", color: "var(--hw-rune)", description: "Stone and bark protectors." },
  fang: { id: "fang", name: "Fang", icon: "sword", color: "var(--hw-ember)", description: "Quick, finishing strikers." },
  root: { id: "root", name: "Root", icon: "root", color: "var(--hw-curse)", description: "Curse-casters and poisoners." },
  grove: { id: "grove", name: "Grove", icon: "leaf", color: "var(--hw-moss)", description: "Menders and buffers." },
  spirit: { id: "spirit", name: "Spirit", icon: "moonGlyph", color: "var(--hw-rune)", description: "Ephemeral, otherworldly creatures." },
  thorn: { id: "thorn", name: "Thorn", icon: "flame", color: "var(--hw-ember)", description: "Raw, unadorned brutes." },
}

export const UNIT_TRIBES = {
  "the-fool": ["thorn"],
  "the-magician": ["thorn"],
  "the-high-priestess": ["grove"],
  "the-empress": ["grove"],
  "the-emperor": ["warden"],
  "the-hierophant": ["thorn"],
  "the-lovers": ["thorn"],
  "the-chariot": ["thorn"],
  strength: ["thorn"],
  "the-hermit": ["thorn"],
  "wheel-of-fortune": ["thorn"],
  justice: ["warden"],
  "the-hanged-man": ["thorn"],
  death: ["thorn"],
  temperance: ["warden"],
  "the-devil": ["thorn"],
  "the-tower": ["thorn"],
  "the-star": ["grove"],
  "the-moon": ["thorn"],
  "the-sun": ["thorn"],
  judgement: ["thorn"],
  "the-world": ["thorn"],
  "knights-leap": ["thorn"],
  "rooks-charge": ["thorn"],
  "bishops-slash": ["thorn"],
  "ember-stag": ["thorn"],
  grovekeeper: ["warden"],
  stormwing: ["root"],
  stoneheart: ["warden"],
  forgehowl: ["thorn"],
  duskclaw: ["fang"],
  ashenhorn: ["grove"],
  rootfang: ["root"],
  wraithbriar: ["spirit"],
  grimtusk: ["fang"],
  thornguard: ["warden"],
  swiftclaw: ["fang"],
  emberwisp: ["thorn"],
  runeveil: ["root"],
  frostbind: ["root"],
  glimmerward: ["grove"],
  wraithcaller: ["spirit"],
  hexmother: ["root"],
  wispkeeper: ["grove"],
  trueshot: ["fang"],
  motley: ["root"],
  thornwarden: ["thorn"],
  bloomcaller: ["grove"],
  mosswalker: ["spirit"],
  ironbark: ["warden"],
  briarblade: ["fang"],
  sapkeeper: ["grove"],
  mycelist: ["root"],
  "spirit-wolf": ["spirit"],
  beastcaller: ["spirit"],
  foxfire: ["fang"],
  loamguard: ["grove"],
  willowfang: ["fang"],
  cragmoss: ["grove"],
  willowmend: ["grove"],
  sparrowthorn: ["thorn"],
  duskwren: ["thorn"],
  rimefang: ["fang"],
  hollowquill: ["thorn"],
  stoneknoll: ["fang"],
  quarrywarden: ["grove"],
  // Added by a concurrent session's Regen round (units.js) - tagged
  // here to keep the tribe roster complete rather than letting these
  // 3 silently fall through tribesOf's `|| []` fallback (no icon, no
  // synergy/tribe-anchor-relic eligibility at all) just because they
  // landed in a different file this session didn't author. Same rule
  // set as every unit above: rallyAdjacent -> Grove (aura mechanic,
  // regardless of which buff id it grants), no distinguishing status
  // -> role-based default (tank -> Warden, dps -> Thorn).
  fernwake: ["grove"],
  duskbramble: ["thorn"],
  hollowmere: ["warden"],
  thistlemaw: ["thorn"],
  brackenveil: ["grove"],
  briarkit: ["fang"],
  hollowspire: ["grove"],
}

// A Tier 2 fusion (units.js's makeTier2) keeps its base unit's tribes -
// `def.fusedFrom` points back to the base id (e.g. "ashenhorn+" ->
// "ashenhorn"), so no separate TIER2 entries are needed here.
export function tribesOf(defId, def) {
  const baseId = def?.fusedFrom || defId
  return UNIT_TRIBES[baseId] || []
}

// 2 thresholds per tribe, tuned to the 4 recruited deploy slots (the
// Commander doesn't count - see autoBattleEngine.js's tribe-counting
// loop - it has no tribe of its own and measures what the player
// actually shopped for, not the fixed 5th slot everyone always has):
// 2-of-a-tribe is an easy early target, 4-of-a-tribe (the whole bench)
// is the realistic ceiling, not 6+ like TFT.
export const SYNERGY_TIERS = {
  warden: [
    { count: 2, effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }] },
    { count: 4, effects: [{ type: "applyBuff", id: "ward", amount: 1 }] },
  ],
  fang: [
    { count: 2, effects: [{ type: "applyBuff", id: "execute", amount: 1 }] },
    { count: 4, effects: [{ type: "applyBuff", id: "execute", amount: 2 }] },
  ],
  root: [
    { count: 2, effects: [{ type: "applyBuff", id: "weak", amount: 1 }] },
    { count: 4, effects: [{ type: "applyBuff", id: "vulnerable", amount: 1 }] },
  ],
  grove: [
    { count: 2, effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 1 } }] },
    { count: 4, effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } }] },
  ],
  spirit: [
    { count: 2, effects: [{ type: "applyBuff", id: "ward", amount: 1 }] },
    { count: 4, effects: [{ type: "applyBuff", id: "revive", amount: 1 }] },
  ],
  thorn: [
    { count: 2, effects: [{ type: "applyBuff", id: "strength", amount: 1 }] },
    { count: 4, effects: [{ type: "applyBuff", id: "strength", amount: 2 }] },
  ],
}

// Pure function: given { tribeId: count }, returns the active tier (if
// any - a count of 1 meets no threshold) for every tribe that has one,
// picking the HIGHEST threshold met rather than stacking every
// threshold below it (same "you're at a tier, not accumulating every
// tier you passed through" shape a relic/Commander rank already has).
// Shared by the engine (applies the effects) and the UI (renders the
// tracker) so the two can never disagree about what's active.
export function resolveSynergies(tribeCounts) {
  const active = []
  for (const [tribeId, count] of Object.entries(tribeCounts)) {
    const tiers = SYNERGY_TIERS[tribeId]
    if (!tiers) continue
    const activeTier = [...tiers].reverse().find((t) => count >= t.count)
    if (activeTier) active.push({ tribeId, count, activeTier })
  }
  return active
}

// The lowest threshold NOT yet met for a tribe, or null once every
// tier is already active - lets the shop/formation tracker say "Fang
// 1 (2 for a bonus)" instead of just "Fang 1", the same "how far am I
// from the next payoff" info Battlegrounds/TFT trackers always show,
// not just whether a bonus is currently on.
export function nextSynergyThreshold(tribeId, count) {
  const tiers = SYNERGY_TIERS[tribeId]
  if (!tiers) return null
  const next = tiers.find((t) => count < t.count)
  return next ? next.count : null
}
