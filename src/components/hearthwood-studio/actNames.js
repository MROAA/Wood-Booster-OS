/*
 * Marc: a bare "Act 3" badge still left him unsure where in the story
 * he was ("on vieläkin epäselvää että missä kohtaa tarinaa teksti
 * esiintyy") - a number alone means nothing without the Act's own
 * theme. These names are the canon already used across the game's data
 * files (crossroads.js's fromAct/intoAct, events.js's own
 * "// --- Act N (Name) ---" section headers, enemies.js's Act/node-band
 * comment) - collected here once so the Studio's own display has a
 * single source instead of guessing or duplicating the string.
 */
export const ACT_NAMES = {
  1: "The Outer Grove",
  2: "The Deepening Woods",
  3: "The Wounded Hearthwood",
  4: "The Reckoning",
  5: "The Crownless",
  6: "The Echo Rift",
  7: "The Echo Verge",
}

export function actLabel(actNumber) {
  const name = ACT_NAMES[actNumber]

  return name ? `Act ${actNumber} — ${name}` : `Act ${actNumber}`
}
