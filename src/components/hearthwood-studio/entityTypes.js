// Single source of truth for every Hearthwood Studio entity type's
// display label + category - shared between EntityBrowser.jsx (the
// type picker) and Dashboard.jsx (the overview + universal search),
// so the two can never drift on what a type is called or grouped as.
//
// Marc, 2026-09-20: "elä tee tuhatta alarivistöä vaan selkeästi kaikki
// esille josta voin muokata" / "laita fiksusti kaikki nippuun silleen
// että se on selkeä muokata" (don't make a thousand sub-lists, clearly
// show everything I can edit - put it all together smartly so it's
// clear to edit). The Story/Economy/Guidance/Other split (optgroups
// behind a closed dropdown) grew into exactly the kind of buried
// nesting he was pointing at. Every registered type is one flat list -
// no menu to open, nothing hidden. `category` is kept per entry purely
// as a small inline tag, not a separate section.
export const ALL_TYPES = [
  { type: "enemies", label: "Enemies", category: "Content" },
  { type: "units", label: "Units", category: "Content" },
  { type: "cards", label: "Cards", category: "Content" },
  { type: "relics", label: "Relics", category: "Content" },
  { type: "items", label: "Items", category: "Content" },
  { type: "characters", label: "Characters", category: "Content" },
  { type: "formations", label: "Formations", category: "Content" },
  { type: "synergies", label: "Synergies", category: "Content" },
  { type: "dualClasses", label: "Dual Classes", category: "Content" },
  { type: "roles", label: "Unit Roles", category: "Content" },
  { type: "evolutions", label: "Evolutions", category: "Content" },
  { type: "upgradeBranches", label: "Upgrade Branches", category: "Content" },
  { type: "arenas", label: "Arenas", category: "Content" },

  // Marc, 2026-09-19: "en löydä mistä voin muokkaa pelin tarinaa"
  { type: "storyJournal", label: "Story Journal", category: "Story" },
  { type: "cinematics", label: "Cinematics", category: "Story" },
  { type: "crossroads", label: "Act Crossroads", category: "Story" },
  { type: "crownless", label: "Crownless Intro", category: "Story" },
  { type: "events", label: "Map Events", category: "Story" },
  { type: "dialogues", label: "Dialogues", category: "Story" },
  { type: "merchants", label: "Merchant Lines", category: "Story" },
  { type: "moods", label: "Forest Mood", category: "Story" },
  { type: "almanac", label: "Almanac Lore", category: "Story" },

  // Marc: "säädän itse sillä pelin vaikeustasoa"
  { type: "economyLevers", label: "Economy Levers", category: "Economy" },
  { type: "investments", label: "Ledger Investments", category: "Economy" },
  { type: "marketEvents", label: "Market Events", category: "Economy" },
  { type: "economyRoles", label: "Economy Crew Roles", category: "Economy" },
  { type: "depths", label: "Depths (Challenge Ladder)", category: "Economy" },
  { type: "boons", label: "Boons", category: "Economy" },
  { type: "banes", label: "Banes", category: "Economy" },

  // Marc, 2026-09-20: "kaiken" - the reference/onboarding text a
  // player actually reads mid-run.
  { type: "help", label: "Help Glossary", category: "Guidance" },
  { type: "coachTips", label: "Coach Tips", category: "Guidance" },
  { type: "threats", label: "Threat Counterplay", category: "Guidance" },
  { type: "trials", label: "Trials", category: "Guidance" },
  { type: "tutorial", label: "Tutorial", category: "Guidance" },
]

export function labelFor(type) {
  return ALL_TYPES.find(entry => entry.type === type)?.label || type
}
