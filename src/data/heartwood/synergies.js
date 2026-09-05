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
// forest/tarot-flavored MECHANICAL tribes:
//   Warden - stone/bark protectors (Taunt, Ward, heavy turnStart Block)
//   Fang   - quick strikers (Haste, Chain, Execute, Shatter)
//   Root   - curse-casters (Poison/Weak/Vulnerable/Stun appliers)
//   Grove  - menders & buffers (heal, rallyHeal, rallyAdjacent auras, Cleanse)
//   Spirit - ephemeral/otherworldly (self-Ward-as-evasion, Revive, summon)
//   Thorn  - raw brutes (no distinguishing status mechanic, just damage)
// Most units carry exactly one mechanical tag, by their dominant
// mechanic first, role only as a last-resort tiebreaker for the many
// "plain attacker, no gimmick" units (default Thorn - deliberately the
// roster's largest tribe).
//
// A unit MAY carry a second tag (Marc, 2026-09-05: "heimoja ja
// synergioita on liian vähän"). Two axes exist:
//   1. a second MECHANICAL tag, for the handful of units whose kit
//      genuinely spans two identities (a curse-caster who also summons,
//      a tank who also finishes kills). Piloted on ~6 units first,
//      behind the fairness gate, since a 2-tag unit counts toward BOTH
//      tribes at once and inflates how often a synergy is live.
//   2. an ELEMENTAL tag (Wood/Ember/Tide/Gale/Stone/Shadow/Cosmic - a
//      later round), a parallel second axis over the 6 mechanical
//      tribes, from the story bible's 7-colour aura language.
// The whole system was already array-first (UNIT_TRIBES values are
// arrays, tribesOf returns them as-is, every consumer iterates), so a
// second tag is a data change only - no engine/UI plumbing change.
export const TRIBES = {
  warden: { id: "warden", name: "Warden", icon: "shield", color: "var(--hw-rune)", description: "Stone and bark protectors." },
  fang: { id: "fang", name: "Fang", icon: "sword", color: "var(--hw-ember)", description: "Quick, finishing strikers." },
  root: { id: "root", name: "Root", icon: "root", color: "var(--hw-curse)", description: "Curse-casters and poisoners." },
  grove: { id: "grove", name: "Grove", icon: "leaf", color: "var(--hw-moss)", description: "Menders and buffers." },
  spirit: { id: "spirit", name: "Spirit", icon: "moonGlyph", color: "var(--hw-rune)", description: "Ephemeral, otherworldly creatures." },
  thorn: { id: "thorn", name: "Thorn", icon: "flame", color: "var(--hw-ember)", description: "Raw, unadorned brutes." },
  // Elemental tribes - the parallel second axis (story bible's 7-colour
  // aura language). Tide/Gale/Stone/Shadow ship first; Wood/Ember/Cosmic
  // follow. Deliberately tuned weaker than the mechanical tribes above:
  // a unit's elemental tag is a bonus lane, not its main identity.
  tide: { id: "tide", name: "Tide", icon: "tide", color: "var(--hw-tide)", description: "Elemental - relentless water: sustain and erosion." },
  gale: { id: "gale", name: "Gale", icon: "gale", color: "var(--hw-gale)", description: "Elemental - wind and speed: strikes that slip past." },
  stone: { id: "stone", name: "Stone", icon: "stone", color: "var(--hw-stone)", description: "Elemental - unmoving armour." },
  shadow: { id: "shadow", name: "Shadow", icon: "shadow", color: "var(--hw-shadow)", description: "Elemental - rot, doom and the finishing dark." },
  wood: { id: "wood", name: "Wood", icon: "wood", color: "var(--hw-wood)", description: "Elemental - growth and sap: sustain that keeps coming." },
  ember: { id: "ember", name: "Ember", icon: "ember", color: "var(--hw-tribe-ember)", description: "Elemental - fire: a flare of burning damage." },
  cosmic: { id: "cosmic", name: "Cosmic", icon: "cosmic", color: "var(--hw-cosmic)", description: "Elemental - the growing, endless power of the stars." },
}

export const UNIT_TRIBES = {
  "the-fool": ["thorn"],
  "the-magician": ["thorn"],
  "the-high-priestess": ["grove"],
  // Multi-tag pilot (2026-09-05): 6 units whose kit genuinely spans two
  // mechanical tribes get a second tag. Kept small on purpose - a
  // 2-tag unit counts toward BOTH tribes, so this is the change most
  // likely to inflate synergy uptime and needs to clear the fairness
  // gate before it's rolled out wider. Each pick is defended inline.
  // Thistlequeen: heal 5 + block 4 - a mender who also holds a wall.
  "the-empress": ["grove", "warden"],
  "the-emperor": ["warden", "stone"],
  "the-hierophant": ["thorn"],
  // Twinbriar: attack 6 + chainDamage 3 - a raw attacker (Thorn) whose
  // hits also finish a second target (Chain, Fang's signature).
  "the-lovers": ["thorn", "fang"],
  "the-chariot": ["thorn"],
  strength: ["thorn"],
  "the-hermit": ["thorn"],
  "wheel-of-fortune": ["thorn", "cosmic"],
  justice: ["warden"],
  "the-hanged-man": ["thorn"],
  death: ["thorn", "shadow"],
  temperance: ["warden"],
  "the-devil": ["thorn"],
  "the-tower": ["thorn"],
  "the-star": ["grove", "cosmic"],
  "the-moon": ["grove", "cosmic"], // was ["thorn"] - kit is pure rallyHeal support, a mistag
  "the-sun": ["thorn", "cosmic"],
  judgement: ["thorn", "cosmic"],
  "the-world": ["thorn", "cosmic"],
  "knights-leap": ["thorn"],
  "rooks-charge": ["thorn"],
  "bishops-slash": ["thorn"],
  "ember-stag": ["thorn", "ember"],
  grovekeeper: ["warden"],
  stormwing: ["root", "gale"],
  stoneheart: ["warden", "stone"],
  forgehowl: ["thorn", "ember"],
  duskclaw: ["fang", "shadow"],
  ashenhorn: ["grove", "wood"],
  rootfang: ["root"],
  // Wraithbriar: Revive passive (Spirit) on a full tank stat line and
  // block-first pattern - an otherworldly thing that also soaks hits.
  wraithbriar: ["spirit", "warden"],
  grimtusk: ["fang"],
  thornguard: ["warden"],
  swiftclaw: ["fang", "gale"],
  emberwisp: ["thorn", "ember"],
  runeveil: ["root"],
  frostbind: ["root"],
  glimmerward: ["grove"],
  wraithcaller: ["spirit", "shadow"],
  hexmother: ["root"],
  wispkeeper: ["grove"],
  trueshot: ["fang", "gale"],
  motley: ["root"],
  thornwarden: ["thorn"],
  bloomcaller: ["grove"],
  mosswalker: ["spirit"],
  ironbark: ["warden"],
  briarblade: ["fang"],
  // Sapkeeper: rallyHeal aura (Grove) + block 4 lead - mends the line
  // and stands in it.
  sapkeeper: ["grove", "warden"],
  mycelist: ["root"],
  "spirit-wolf": ["spirit"],
  beastcaller: ["spirit"],
  foxfire: ["fang", "ember"],
  loamguard: ["grove", "wood"],
  willowfang: ["fang"],
  cragmoss: ["grove", "stone"],
  willowmend: ["grove"],
  sparrowthorn: ["thorn", "gale"],
  duskwren: ["thorn", "gale"],
  rimefang: ["fang", "tide"],
  hollowquill: ["thorn", "shadow"],
  // Stoneknoll: Shatter passive (Fang) on a plain attack-6 dps line
  // with no other gimmick (Thorn).
  stoneknoll: ["fang", "thorn"],
  // Quarrywarden: rallyAdjacent Shatter aura (Grove's aura mechanic) on
  // a block-5 tank body (Warden).
  quarrywarden: ["grove", "warden"],
  // Added by a concurrent session's Regen round (units.js) - tagged
  // here to keep the tribe roster complete rather than letting these
  // 3 silently fall through tribesOf's `|| []` fallback (no icon, no
  // synergy/tribe-anchor-relic eligibility at all) just because they
  // landed in a different file this session didn't author. Same rule
  // set as every unit above: rallyAdjacent -> Grove (aura mechanic,
  // regardless of which buff id it grants), no distinguishing status
  // -> role-based default (tank -> Warden, dps -> Thorn).
  fernwake: ["grove", "wood"],
  duskbramble: ["thorn", "ember"],
  hollowmere: ["warden", "tide"],
  thistlemaw: ["thorn"],
  brackenveil: ["grove", "wood"],
  briarkit: ["fang"],
  hollowspire: ["grove", "wood"],
  thornwisp: ["root"],
  // Same gap, same fix, a second time - 3 more units (2 balance-round
  // additions, 1 rare-tier round) landed in units.js without a matching
  // entry here. Same rule set: mosshollow has no distinguishing status
  // (just block+attack) -> role-based default, tank -> Warden.
  // Hollowveil's own passive IS Ward, Warden's defining mechanic, so no
  // tiebreaker needed. Ashcaller carries Sunder, same mechanic
  // Thornwisp above is already tagged Root for - consistency with that
  // precedent over Fang's own "quick striker" flavor, since Sunder is
  // the same curse/debuff-stripping tool either way.
  mosshollow: ["warden", "stone"],
  hollowveil: ["warden"],
  ashcaller: ["root"],
  witherkit: ["root"],
  stormveil: ["fang", "gale"],
  palefen: ["spirit", "tide"],
  mistveil: ["spirit", "tide"],
  wraithguard: ["spirit", "shadow"],
  nightveil: ["spirit", "shadow"],
  stoneknit: ["warden", "stone"],
  snareclaw: ["fang"],
  // 6 brand-new units (units.js, same session) built around leftover
  // art rather than an existing def - tagged the same way every unit
  // above is: by its own dominant mechanic first, role as a tiebreaker.
  // Chimera has no distinguishing status, just a Chain finisher and a
  // ferocious multi-headed silhouette -> Fang (quick, finishing
  // strikers) over a generic Thorn default. Sunscale's kit (repeating
  // Block) is Warden's defining shape. Abyssong's Weak-on-hit siren
  // song is a curse, but its support role and healing lean Grove-
  // adjacent in flavor - tagged Spirit instead for the literal
  // "ephemeral, otherworldly" read on a ghostly sea-spirit. Huldra is
  // a forest witch who curses/poisons -> Root. Rootwing is a Yggdrasil
  // guardian with a battle-start Taunt -> Warden, same as every other
  // Taunt-carrying protector. Marshlight is a self-Ward, ephemeral
  // wisp -> Spirit, same identity Mosswalker/Palefen already carry.
  chimera: ["fang"],
  sunscale: ["warden"],
  abyssong: ["spirit", "tide"],
  huldra: ["root"],
  rootwing: ["warden"],
  marshlight: ["spirit", "tide"],
}

// A Tier 2 fusion (units.js's makeTier2) keeps its base unit's tribes -
// `def.fusedFrom` points back to the base id (e.g. "ashenhorn+" ->
// "ashenhorn"), so no separate TIER2 entries are needed here.
export function tribesOf(defId, def) {
  const baseId = def?.fusedFrom || defId
  return UNIT_TRIBES[baseId] || []
}

// 3 thresholds per tribe (count 2 / 3 / 4), tuned to the 4 recruited
// deploy slots (the Commander doesn't count - see autoBattleEngine.js's
// tribe-counting loop - it has no tribe of its own and measures what the
// player actually shopped for, not the fixed 5th slot everyone always
// has): 2-of-a-tribe is an easy early target, 3-of rewards a partial
// commitment, 4-of (the whole bench) is the ceiling, not 6+ like TFT.
// resolveSynergies returns only the HIGHEST met tier (not cumulative),
// so every tier's `effects` is self-contained - a higher tier restates
// the lower one's payoff plus more, never strictly less, so growing a
// tribe is always an upgrade.
// `label` on each tier (Marc's own long-running "playable by eye" rule,
// applied here too) - the tracker used to show "Warden 2 ✓" with a
// tooltip that only gave flavor text ("Stone and bark protectors"),
// never what the bonus actually DOES. Every other mechanic in this
// game (relics, items, Commander powers) states its real effect in
// plain language; tribe synergies were the one place that had quietly
// stayed flavor-only since the very first round that shipped them.
export const SYNERGY_TIERS = {
  warden: [
    {
      count: 2,
      label: "Whole squad: +2 Block each round",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }],
    },
    {
      count: 3,
      label: "Whole squad: +3 Block each round",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
    },
    {
      count: 4,
      label: "Whole squad: +3 Block each round and +1 Ward",
      effects: [
        { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } },
        { type: "applyBuff", id: "ward", amount: 1 },
      ],
    },
  ],
  fang: [
    { count: 2, label: "Whole squad: +1 Execute", effects: [{ type: "applyBuff", id: "execute", amount: 1 }] },
    {
      count: 3,
      label: "Whole squad: +1 Execute and +1 Strength",
      effects: [
        { type: "applyBuff", id: "execute", amount: 1 },
        { type: "applyBuff", id: "strength", amount: 1 },
      ],
    },
    {
      count: 4,
      label: "Whole squad: +2 Execute and +1 Strength",
      effects: [
        { type: "applyBuff", id: "execute", amount: 2 },
        { type: "applyBuff", id: "strength", amount: 1 },
      ],
    },
  ],
  // Root fix (Marc, 2026-09-05): every tier used to `applyBuff` Weak /
  // Vulnerable onto the player's OWN squad (self-target), a straight
  // downside on your own units. Now the squad's own hits apply the
  // curse to whoever they strike - an onDealDamage trigger with
  // target:"target", the exact shape the-magician's passive and the
  // Dream Healer dual-class already use.
  root: [
    {
      count: 2,
      label: "Whole squad: hits apply Weak 1",
      effects: [
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } },
      ],
    },
    {
      count: 3,
      label: "Whole squad: hits apply Weak 1 and Vulnerable 1",
      effects: [
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } },
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 } },
      ],
    },
    {
      count: 4,
      label: "Whole squad: hits apply Weak 1, Vulnerable 1 and Poison 1",
      effects: [
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "weak", target: "target", amount: 1 } },
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "vulnerable", target: "target", amount: 1 } },
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
      ],
    },
  ],
  grove: [
    {
      count: 2,
      label: "Whole squad: +1 heal each round",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 1 } }],
    },
    {
      count: 3,
      label: "Whole squad: +2 heal each round",
      effects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } }],
    },
    {
      count: 4,
      label: "Whole squad: +2 heal each round and +2 Regen",
      effects: [
        { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 2 } },
        { type: "applyBuff", id: "regen", amount: 2 },
      ],
    },
  ],
  spirit: [
    { count: 2, label: "Whole squad: +1 Ward", effects: [{ type: "applyBuff", id: "ward", amount: 1 }] },
    { count: 3, label: "Whole squad: +2 Ward", effects: [{ type: "applyBuff", id: "ward", amount: 2 }] },
    {
      count: 4,
      label: "Whole squad: +2 Ward and +1 Revive",
      effects: [
        { type: "applyBuff", id: "ward", amount: 2 },
        { type: "applyBuff", id: "revive", amount: 1 },
      ],
    },
  ],
  thorn: [
    { count: 2, label: "Whole squad: +1 Strength", effects: [{ type: "applyBuff", id: "strength", amount: 1 }] },
    { count: 3, label: "Whole squad: +2 Strength", effects: [{ type: "applyBuff", id: "strength", amount: 2 }] },
    { count: 4, label: "Whole squad: +3 Strength", effects: [{ type: "applyBuff", id: "strength", amount: 3 }] },
  ],

  // --- Elemental tribes (parallel second axis) --------------------------
  // Deliberately lighter than the mechanical ladders above: an elemental
  // tag is a bonus lane on top of a unit's main identity, and with 13
  // tribes total most elemental synergies only ever reach count 2-3.
  tide: [
    { count: 2, label: "Whole squad: +1 Regen", effects: [{ type: "applyBuff", id: "regen", amount: 1 }] },
    { count: 3, label: "Whole squad: +2 Regen", effects: [{ type: "applyBuff", id: "regen", amount: 2 }] },
    {
      count: 4,
      label: "Whole squad: +2 Regen, hits Dampen 1",
      effects: [
        { type: "applyBuff", id: "regen", amount: 2 },
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "dampen", target: "target", amount: 1 } },
      ],
    },
  ],
  gale: [
    { count: 2, label: "Whole squad: Evade 1 (dodges 1 hit)", effects: [{ type: "applyBuff", id: "evade", amount: 1 }] },
    {
      count: 3,
      label: "Whole squad: Evade 1 and +1 Strength",
      effects: [
        { type: "applyBuff", id: "evade", amount: 1 },
        { type: "applyBuff", id: "strength", amount: 1 },
      ],
    },
    {
      count: 4,
      label: "Whole squad: Evade 2 and +1 Strength",
      effects: [
        { type: "applyBuff", id: "evade", amount: 2 },
        { type: "applyBuff", id: "strength", amount: 1 },
      ],
    },
  ],
  stone: [
    { count: 2, label: "Whole squad: +1 Bulwark (permanent armour)", effects: [{ type: "applyBuff", id: "bulwark", amount: 1 }] },
    { count: 3, label: "Whole squad: +2 Bulwark", effects: [{ type: "applyBuff", id: "bulwark", amount: 2 }] },
    {
      count: 4,
      label: "Whole squad: +2 Bulwark and +2 Block each round",
      effects: [
        { type: "applyBuff", id: "bulwark", amount: 2 },
        { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      ],
    },
  ],
  shadow: [
    { count: 2, label: "Whole squad: +1 Execute", effects: [{ type: "applyBuff", id: "execute", amount: 1 }] },
    {
      count: 3,
      label: "Whole squad: +1 Execute, hits apply Poison 1",
      effects: [
        { type: "applyBuff", id: "execute", amount: 1 },
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
      ],
    },
    {
      count: 4,
      label: "Whole squad: +2 Execute, hits apply Poison 1",
      effects: [
        { type: "applyBuff", id: "execute", amount: 2 },
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
      ],
    },
  ],
  // Wood: bramble/bark that bites back - retaliation (the onHit hook
  // Bramble Ward introduced), the one elemental identity not already
  // covered by Tide's Regen or Grove's heals.
  wood: [
    {
      count: 2,
      label: "Whole squad: strikes back for 2 when hit",
      effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 2 } }],
    },
    {
      count: 3,
      label: "Whole squad: strikes back for 3 when hit",
      effects: [{ type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 3 } }],
    },
    {
      count: 4,
      label: "Whole squad: strikes back for 3 when hit, and +2 Block each round",
      effects: [
        { type: "addTrigger", trigger: "onHit", effect: { type: "damage", amount: 3 } },
        { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      ],
    },
  ],
  // Ember: a burst of Burn on the squad's hits (effects.js's tickBurn -
  // halves each round, a flare not a drip).
  ember: [
    {
      count: 2,
      label: "Whole squad: hits apply Burn 2",
      effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 2 } }],
    },
    {
      count: 3,
      label: "Whole squad: hits apply Burn 3",
      effects: [{ type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 3 } }],
    },
    {
      count: 4,
      label: "Whole squad: hits apply Burn 3, and +1 Strength",
      effects: [
        { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 3 } },
        { type: "applyBuff", id: "strength", amount: 1 },
      ],
    },
  ],
  // Cosmic: Ascendant (effects.js's tickAscendant) - +Strength every
  // round, a scaling win condition for a long fight.
  cosmic: [
    { count: 2, label: "Whole squad: +1 Strength each round (Ascendant)", effects: [{ type: "applyBuff", id: "ascendant", amount: 1 }] },
    {
      count: 3,
      label: "Whole squad: +1 Strength each round and +1 Ward",
      effects: [
        { type: "applyBuff", id: "ascendant", amount: 1 },
        { type: "applyBuff", id: "ward", amount: 1 },
      ],
    },
    {
      count: 4,
      label: "Whole squad: +2 Strength each round and +1 Ward",
      effects: [
        { type: "applyBuff", id: "ascendant", amount: 2 },
        { type: "applyBuff", id: "ward", amount: 1 },
      ],
    },
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

// Plain-language "what does this actually do" for a tooltip - the
// CURRENTLY active tier's label if one is met, otherwise the NEXT
// tier's (so hovering an unmet tribe still tells you what you're
// building toward, not just that you aren't there yet). Kept out of
// the badge's own visible text (Marc: "UI needs to be clear and
// minimalistic while also giving enough info" - the badge itself stays
// a compact "Warden 2 ✓", this is the on-hover detail for whoever wants
// it, not something forced onto everyone's screen at once).
export function synergyTierLabel(tribeId, count) {
  const tiers = SYNERGY_TIERS[tribeId]
  if (!tiers) return null
  const active = [...tiers].reverse().find((t) => count >= t.count)
  if (active) return active.label
  const next = tiers.find((t) => count < t.count)
  return next ? `At ${next.count}: ${next.label}` : null
}

// Static (no live count needed) reference text for a tribe's full tier
// ladder - used on a single unit's own tribe icon (UnitCard.jsx),
// where there's no squad-composition context yet to say "you're at 2,"
// just "here's what this tribe is worth building toward."
export function synergyTiersSummary(tribeId) {
  const tiers = SYNERGY_TIERS[tribeId]
  if (!tiers) return null
  return tiers.map((t) => `${t.count}: ${t.label}`).join(". ")
}

// --- Cross-tribe combo synergies -------------------------------------
// A payoff neither tribe grants alone, for a squad that splits its four
// slots across two identities instead of committing to one. Threshold
// is always 2+2 (the most a 4-slot squad can do while touching two
// tribes), so a combo is a real either/or against a single tribe's
// count-4 tier, not a free extra. `effects` use the same vocabulary as
// SYNERGY_TIERS and are applied squad-wide at battle start.
export const COMBO_SYNERGIES = [
  {
    id: "bloodhunt",
    tribes: { fang: 2, root: 2 },
    label: "Fang + Root: +1 Execute, hits apply Poison 1",
    effects: [
      { type: "applyBuff", id: "execute", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
    ],
  },
  {
    id: "stormsurge",
    tribes: { tide: 2, gale: 2 },
    label: "Tide + Gale: +2 Block each round, Evade 1",
    effects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      { type: "applyBuff", id: "evade", amount: 1 },
    ],
  },
  {
    id: "landslide",
    tribes: { stone: 2, thorn: 2 },
    label: "Stone + Thorn: +1 Strength, +1 Bulwark",
    effects: [
      { type: "applyBuff", id: "strength", amount: 1 },
      { type: "applyBuff", id: "bulwark", amount: 1 },
    ],
  },
  {
    id: "eclipse",
    tribes: { shadow: 2, spirit: 2 },
    label: "Shadow + Spirit: +1 Ward, +1 Execute",
    effects: [
      { type: "applyBuff", id: "ward", amount: 1 },
      { type: "applyBuff", id: "execute", amount: 1 },
    ],
  },
  {
    id: "grovewall",
    tribes: { warden: 2, grove: 2 },
    label: "Warden + Grove: +2 Block and +1 heal each round",
    effects: [
      { type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } },
      { type: "addTrigger", trigger: "turnStart", effect: { type: "heal", amount: 1 } },
    ],
  },
  {
    id: "wildfire",
    tribes: { ember: 2, wood: 2 },
    label: "Ember + Wood: hits apply Burn 2, +1 Regen",
    effects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 2 } },
      { type: "applyBuff", id: "regen", amount: 1 },
    ],
  },
  {
    id: "supernova",
    tribes: { cosmic: 2, ember: 2 },
    label: "Cosmic + Ember: +1 Strength each round (Ascendant), hits apply Burn 2",
    effects: [
      { type: "applyBuff", id: "ascendant", amount: 1 },
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "burn", target: "target", amount: 2 } },
    ],
  },
  {
    id: "sandstorm",
    tribes: { stone: 2, gale: 2 },
    label: "Stone + Gale: +1 Bulwark, Evade 1",
    effects: [
      { type: "applyBuff", id: "bulwark", amount: 1 },
      { type: "applyBuff", id: "evade", amount: 1 },
    ],
  },
]

// Given { tribeId: count } (deployedTribeCounts / the engine's own
// recruited-squad count), the combos whose every threshold is met.
export function resolveComboSynergies(tribeCounts) {
  return COMBO_SYNERGIES.filter((c) =>
    Object.entries(c.tribes).every(([t, n]) => (tribeCounts[t] || 0) >= n),
  )
}

// --- Formation / positional synergies -------------------------------
// Grid placement as a real build lever. Slot indices map 1:1 to
// autoBattleEngine.js's SLOT_POSITIONS: 0/1/2 are the back row
// (row 2, cols 0/1/2), 3 is the forward-centre (row 1, col 1) that
// shields slot 1. The Commander (row 1, col 0) is never a slot here.
// Declarative `when` only - no functions in data, so this stays
// serialisable/reviewable, same reasoning as the tribe lookup table.
//   when.slotAnyTribe : { slot, anyOf }  - that slot is filled and its
//                                          tribes intersect anyOf
//   when.allFilled    : [slots]          - every listed slot is filled
//   when.allTribe     : { slots, anyOf } - every listed slot is filled
//                                          AND each intersects anyOf
// Effects: `selfEffects` -> the `slot` in slotAnyTribe; `slotsEffects`
// -> every slot in `slots`; `squadEffects` -> the whole squad.
export const POSITION_SYNERGIES = [
  {
    id: "phalanx",
    when: { slotAnyTribe: { slot: 3, anyOf: ["warden", "stone"] } },
    label: "Forward slot holds a Warden or Stone: it gains +3 Block/round, the squad +1",
    selfEffects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 3 } }],
    squadEffects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 1 } }],
  },
  {
    id: "column-wall",
    when: { allTribe: { slots: [1, 3], anyOf: ["warden", "stone"] } },
    slots: [1, 3],
    label: "Warden/Stone stacked in the shielding column (slots 1 and 3): both gain +2 Block/round",
    slotsEffects: [{ type: "addTrigger", trigger: "turnStart", effect: { type: "block", amount: 2 } }],
  },
  {
    id: "skirmish-line",
    when: { allTribe: { slots: [0, 1, 2], anyOf: ["fang", "gale"] } },
    slots: [0, 1, 2],
    label: "Whole back row is Fang or Gale: back row gains +1 Execute and Evade 1",
    slotsEffects: [
      { type: "applyBuff", id: "execute", amount: 1 },
      { type: "applyBuff", id: "evade", amount: 1 },
    ],
  },
  {
    id: "vanguard",
    when: { allTribe: { slots: [0, 3], anyOf: ["fang", "thorn"] } },
    slots: [0, 3],
    label: "Fang/Thorn in both slots flanking the Commander (0 and 3): those two gain +1 Strength",
    slotsEffects: [{ type: "applyBuff", id: "strength", amount: 1 }],
  },
  {
    id: "backline-coven",
    when: { allTribe: { slots: [0, 1, 2], anyOf: ["root", "shadow"] } },
    slots: [0, 1, 2],
    label: "Whole back row is Root or Shadow: back row hits apply Poison 1",
    slotsEffects: [
      { type: "addTrigger", trigger: "onDealDamage", effect: { type: "applyBuff", id: "poison", target: "target", amount: 1 } },
    ],
  },
]

function slotFilled(slotTribes, i) {
  return Array.isArray(slotTribes[i]) && slotTribes[i].length > 0
}
function slotIntersects(slotTribes, i, anyOf) {
  return slotFilled(slotTribes, i) && slotTribes[i].some((t) => anyOf.includes(t))
}

// `slotTribes`: { [slotIndex 0..3]: string[] } built from whichever
// side has the roster (the engine from recruitedUnits, FormationScreen
// from runState.deployed) - one shared evaluator so the two never
// drift. Returns [{ synergy, scope, slots, effects }] where scope is
// "self" | "slots" | "squad".
export function resolvePositionSynergies(slotTribes) {
  const hits = []
  for (const ps of POSITION_SYNERGIES) {
    const w = ps.when
    let met = false
    let triggerSlot = null
    if (w.slotAnyTribe) {
      met = slotIntersects(slotTribes, w.slotAnyTribe.slot, w.slotAnyTribe.anyOf)
      triggerSlot = w.slotAnyTribe.slot
    } else if (w.allFilled) {
      met = w.allFilled.every((i) => slotFilled(slotTribes, i))
    } else if (w.allTribe) {
      met = w.allTribe.slots.every((i) => slotIntersects(slotTribes, i, w.allTribe.anyOf))
    }
    if (!met) continue
    if (ps.selfEffects && triggerSlot != null) hits.push({ synergy: ps, scope: "self", slots: [triggerSlot], effects: ps.selfEffects })
    if (ps.slotsEffects) hits.push({ synergy: ps, scope: "slots", slots: ps.slots || [], effects: ps.slotsEffects })
    if (ps.squadEffects) hits.push({ synergy: ps, scope: "squad", slots: [], effects: ps.squadEffects })
  }
  return hits
}

// The set of slot indices that participate in at least one active
// position synergy - FormationScreen uses this to ring those grid
// cells, so the board itself shows the bonus.
export function activePositionSlots(slotTribes) {
  const set = new Set()
  for (const hit of resolvePositionSynergies(slotTribes)) {
    if (hit.scope === "squad") continue
    for (const s of hit.slots) set.add(s)
    // also light the trigger slot's own participants for a slots-scope
    // rule whose `when` named specific slots
    if (hit.synergy.when.allTribe) for (const s of hit.synergy.when.allTribe.slots) set.add(s)
    if (hit.synergy.when.allFilled) for (const s of hit.synergy.when.allFilled) set.add(s)
  }
  return [...set]
}
