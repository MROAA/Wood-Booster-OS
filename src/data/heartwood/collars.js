// Hearthwood - CLASS COLLARS (the gear sprint, Mewgenics-style). Pure
// data - Studio-editable (Hearthwood Studio > 🎒 Gear > Collars).
//
// As a player reads it: a Class Collar in a hero's gear row makes it
// fight as that class (class skills, passive AND resource) while worn.
// Take it off and the hero's natural class comes back. One collar per
// hero; the Commander can't wear one. Collars drop from elites (half the
// time) and minibosses (always), a strange event, and rarely the shop.
//
// Fields: id, name, collarClass (classes.js id), description.
// Collars join ITEMS (kind "collar", rarity "epic", cost 200) in items.js.

export const COLLARS = {
  "collar-guardian": { id: "collar-guardian", name: "Guardian Collar", collarClass: "guardian", description: "While worn, this hero fights as a Guardian - protects allies and holds the front line." },
  "collar-warden": { id: "collar-warden", name: "Warden Collar", collarClass: "warden", description: "While worn, this hero fights as a Warden - guards an area, not just one ally." },
  "collar-juggernaut": { id: "collar-juggernaut", name: "Juggernaut Collar", collarClass: "juggernaut", description: "While worn, this hero fights as a Juggernaut - slow, but almost impossible to stop." },
  "collar-sentinel": { id: "collar-sentinel", name: "Sentinel Collar", collarClass: "sentinel", description: "While worn, this hero fights as a Sentinel - a sniper that holds a perch and picks targets off from long range." },
  "collar-bruiser": { id: "collar-bruiser", name: "Bruiser Collar", collarClass: "bruiser", description: "While worn, this hero fights as a Bruiser - tough and hard-hitting, fights in the thick of it." },
  "collar-striker": { id: "collar-striker", name: "Striker Collar", collarClass: "striker", description: "While worn, this hero fights as a Striker - reliable, steady damage." },
  "collar-assassin": { id: "collar-assassin", name: "Assassin Collar", collarClass: "assassin", description: "While worn, this hero fights as an Assassin - slips behind the lines and kills a key target." },
  "collar-duelist": { id: "collar-duelist", name: "Duelist Collar", collarClass: "duelist", description: "While worn, this hero fights as a Duelist - locks down and beats one important enemy." },
  "collar-ranger": { id: "collar-ranger", name: "Ranger Collar", collarClass: "ranger", description: "While worn, this hero fights as a Ranger - a hunter that marks prey, keeps moving and bounces shots between targets." },
  "collar-artillery": { id: "collar-artillery", name: "Artillery Collar", collarClass: "artillery", description: "While worn, this hero fights as Artillery - a grenadier that lobs explosives over cover and blows cover apart." },
  "collar-executioner": { id: "collar-executioner", name: "Executioner Collar", collarClass: "executioner", description: "While worn, this hero fights as an Executioner - finishes off wounded enemies." },
  "collar-spellblade": { id: "collar-spellblade", name: "Spellblade Collar", collarClass: "spellblade", description: "While worn, this hero fights as a Spellblade - blade and spell, loves element combos." },
  "collar-healer": { id: "collar-healer", name: "Healer Collar", collarClass: "healer", description: "While worn, this hero fights as a Healer - keeps the team on its feet." },
  "collar-medic": { id: "collar-medic", name: "Medic Collar", collarClass: "medic", description: "While worn, this hero fights as a Medic - emergency care that saves allies at the critical moment." },
  "collar-buffer": { id: "collar-buffer", name: "Buffer Collar", collarClass: "buffer", description: "While worn, this hero fights as a Buffer - makes the right ally much stronger." },
  "collar-tactician": { id: "collar-tactician", name: "Tactician Collar", collarClass: "tactician", description: "While worn, this hero fights as a Tactician - reads the battlefield and reshapes it." },
  "collar-controller": { id: "collar-controller", name: "Controller Collar", collarClass: "controller", description: "While worn, this hero fights as a Controller - takes options away from the enemy." },
  "collar-frostbinder": { id: "collar-frostbinder", name: "Frostbinder Collar", collarClass: "frostbinder", description: "While worn, this hero fights as a Frostbinder - a frost mage that slows the fight down and turns ground to ice." },
  "collar-rootweaver": { id: "collar-rootweaver", name: "Rootweaver Collar", collarClass: "rootweaver", description: "While worn, this hero fights as a Rootweaver - controls the battlefield with roots, vines and living walls." },
  "collar-disruptor": { id: "collar-disruptor", name: "Disruptor Collar", collarClass: "disruptor", description: "While worn, this hero fights as a Disruptor - breaks the enemy's plan before it happens." },
  "collar-trapper": { id: "collar-trapper", name: "Trapper Collar", collarClass: "trapper", description: "While worn, this hero fights as a Trapper - pins enemies down, lays smoke and sets traps." },
  "collar-hexer": { id: "collar-hexer", name: "Hexer Collar", collarClass: "hexer", description: "While worn, this hero fights as a Hexer - a curse mage that weakens enemies with hexes." },
  "collar-summoner": { id: "collar-summoner", name: "Summoner Collar", collarClass: "summoner", description: "While worn, this hero fights as a Summoner - calls spirits to fight and fill the board." },
  "collar-beastmaster": { id: "collar-beastmaster", name: "Beastmaster Collar", collarClass: "beastmaster", description: "While worn, this hero fights as a Beastmaster - fights side by side with an animal companion." },
  "collar-alchemist": { id: "collar-alchemist", name: "Alchemist Collar", collarClass: "alchemist", description: "While worn, this hero fights as an Alchemist - lobs poisons and fire into explosive reactions." },
  "collar-scout": { id: "collar-scout", name: "Scout Collar", collarClass: "scout", description: "While worn, this hero fights as a Scout - fast, spots prey for the whole squad." },
  "collar-saboteur": { id: "collar-saboteur", name: "Saboteur Collar", collarClass: "saboteur", description: "While worn, this hero fights as a Saboteur - wrecks barricades, totems and defenses." },
  "collar-engineer": { id: "collar-engineer", name: "Engineer Collar", collarClass: "engineer", description: "While worn, this hero fights as an Engineer - builds turrets and barricades." },
  "collar-spiritwalker": { id: "collar-spiritwalker", name: "Spiritwalker Collar", collarClass: "spiritwalker", description: "While worn, this hero fights as a Spiritwalker - walks between worlds, slips past walls and saves allies." },
  "collar-ritualist": { id: "collar-ritualist", name: "Ritualist Collar", collarClass: "ritualist", description: "While worn, this hero fights as a Ritualist - builds a great spell over several turns." },
  "collar-chronomancer": { id: "collar-chronomancer", name: "Chronomancer Collar", collarClass: "chronomancer", description: "While worn, this hero fights as a Chronomancer - bends the rhythm of turns and cooldowns." },
  "collar-shapeshifter": { id: "collar-shapeshifter", name: "Shapeshifter Collar", collarClass: "shapeshifter", description: "While worn, this hero fights as a Shapeshifter - changes form to fit the fight." },
  "collar-corruptor": { id: "collar-corruptor", name: "Corruptor Collar", collarClass: "corruptor", description: "While worn, this hero fights as a Corruptor - feeds on the enemy's weaknesses." },
  "collar-merchant": { id: "collar-merchant", name: "Merchant Collar", collarClass: "merchant", description: "While worn, this hero fights as a Merchant - turns fights into profit and hands out supplies." },
  "collar-relic-keeper": { id: "collar-relic-keeper", name: "Relic Keeper Collar", collarClass: "relic-keeper", description: "While worn, this hero fights as a Relic Keeper - wakes old relics and bends the rules of the fight." },
  "collar-cleanser": { id: "collar-cleanser", name: "Cleanser Collar", collarClass: "cleanser", description: "While worn, this hero fights as a Cleanser - washes away poisons, curses and ailments." },
  "collar-gatherer": { id: "collar-gatherer", name: "Gatherer Collar", collarClass: "gatherer", description: "While worn, this hero fights as a Gatherer - lives off the land: forages, scavenges and grows cover." },
}
