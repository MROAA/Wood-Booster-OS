// Hearthwood - Trials. A Trial is a named narrative wrapper around an
// existing enemy/formation encounter, not a redefinition of its combat.
// This lets a miniboss/boss carry real story identity (title, its own
// intro/victory/defeat lines) without ever touching the balance work
// already done on the underlying enemy def - `enemyId` still resolves
// through ENEMIES exactly as before, only the presentation layer reads
// through the Trial when one wraps the node.
//
// First entry: Rootkeeper (Act I's boss, from Marc's own written story -
// docs/hearthwood-story-acts.md) wraps the existing "deepwarden" miniboss
// (already-tuned stats/moveset, a defensive warden-type enemy - a close
// mechanical fit for a corrupted tree-guardian). Content for more Trials
// (Heartwood Warden/Act II, Veilbound/Act III, Hollow King/Act IV,
// The Crownless/Act V) already exists in full in that same doc - this
// table is the seam they drop into next, one entry each, with zero
// further engine work.
export const TRIALS = {
  rootkeeper: {
    id: "rootkeeper",
    enemyId: "deepwarden",
    title: "Rootkeeper",
    rank: 1,
    act: "The Outer Grove",
    beat: "The forest's oldest guardian, still standing watch - corruption has reached him too.",
    introLine:
      '"Pysähdy. Sinä... vieras... Miksi kosket juuriani?" He does not move to strike yet - only to be heard.',
    victoryLine:
      '"...Sinä et ole korruptio." The roots fall away. Light kindles in his chest. "Kuuntele. Korruptio ei tule juurista. Se tulee syvemmältä." He is not defeated - he is purified.',
  },
  // Second Trial - Heartwood Warden (Act II's boss) wraps "thornmaw":
  // its own self-Regen+self-Taunt kit (won't go down, forces you to
  // commit) is a real mechanical fit for a guardian who "decides whether
  // you're a protector or a destroyer" and won't be rushed past.
  "heartwood-warden": {
    id: "heartwood-warden",
    enemyId: "thornmaw",
    title: "Heartwood Warden",
    rank: 2,
    act: "The Deepening Woods",
    beat: "The heart's physical guardian - not corrupted, but he doesn't trust you yet.",
    introLine:
      '"Sinä olet kulkenut liian pitkälle, vieras." He raises a hand; roots rise with it. "Kaikki, jotka koskevat sydäntä, ovat joko suojelijoita... tai tuhoajia. Minä päätän, kumpi sinä olet."',
    victoryLine:
      '"...Sinä et ole tuhoaja." He looks at you directly. "Sydän piiloutuu... koska se pelkää Hollow Kingiä. Ja sinä... sinä olet avain." He turns toward the deeper woods. "Meidän täytyy mennä Veiliin."',
  },
  // Third Trial - Veilbound (Act III's boss) wraps "wyrmgall": its own
  // self-Execute+self-Shatter kit already punishes BOTH pure-aggression
  // (Execute finishes a wounded player unit) and pure-defense (Shatter
  // punishes Block-stacking) - a genuine mechanical fit for a being that
  // "doesn't test power, it tests truth" and can't be cheesed one way or
  // the other.
  veilbound: {
    id: "veilbound",
    enemyId: "wyrmgall",
    title: "Veilbound",
    rank: 3,
    act: "The Wounded Heartwood",
    beat: "A being born from the border of reality - not evil, only the Veil's will given shape.",
    introLine:
      '"Sinä olet kulkenut liian pitkälle." Its shape will not hold still. "Vihollinen... ystävä... nämä sanat eivät merkitse mitään täällä. Veil ei testaa voimaa. Se testaa... totuutta."',
    victoryLine:
      '"...Sinä et ole tyhjyyden lapsi." Its shape stabilizes for the first time. "Sydän piiloutuu... koska Hollow King etsii sitä. Tyhjyys ei ole paha. Se on... yksin." It closes its eyes. "...Meidän täytyy mennä The Hollow."',
  },
  // Fourth Trial - the final boss. Marc, asked directly (his own story
  // treats Hollow King as the real final threat, with Spacemonkey
  // exiting into the void before this fight rather than being the one
  // faced here): confirmed swapping the final boss's identity to Hollow
  // King, wrapping the existing "spacemonkey" boss fight (same unique
  // Revive/AoE kit, already the one fight in the game meant to feel
  // different from every other - see enemies.js's own comment on it).
  // Spacemonkey himself stays in the story as the guide/ally who exits
  // earlier, exactly as written - just no longer who you fight here.
  // "Marc" genericized to "you" per Marc's own clarification that the
  // dialogue's "Marc" means the player generically, not a literal name.
  "hollow-king": {
    id: "hollow-king",
    enemyId: "spacemonkey",
    title: "The Hollow King",
    rank: 4,
    act: "The Reckoning",
    beat: "The void's own child, once the forest's first guardian. Not a tyrant - a guardian who failed.",
    introLine:
      '"...Miksi tulit?" No face, no crown, no shape - only an absent shape where one should be. "Metsä ei tarvitse pelastusta. Se tarvitsee... totuuden. Näytä minulle, miksi sydän luottaa sinuun."',
    victoryLine:
      '"...Sinä... Sinä et ole tyhjyyden lapsi." The void around him trembles, as if it were crying. "Sydän... piiloutui minulta. Mutta se... luottaa sinuun." He does not fall. He simply ceases to be.',
  },
}

export function resolveTrial(id) {
  return TRIALS[id] || null
}
