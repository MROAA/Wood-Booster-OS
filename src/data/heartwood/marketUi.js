// Market & Headquarters texts - every title, subtitle and rune on the
// Market screen and the Headquarters camp screen.
//
// Editable in Hearthwood Studio ("Market & Headquarters Texts") - Marc:
// "haluan pystyä muokkaamaan siitä kaiken tarpeellisen". The game is in
// English - every word on screen; the camp is "Headquarters". Each entry:
//   name     - the English title shown on screen
//   subtitle - an optional small line beside it, in English (or "")
//   rune     - one Elder Futhark rune shown before the title (or "")
//   meaning  - what the rune means, shown when you hover it
export const MARKET_UI = {
  screen: { name: "The Hearthwood Market", subtitle: "", rune: "", meaning: "" },
  arrival: { name: "Your camp arrives at the market", subtitle: "A new stop on the road", rune: "ᛞ", meaning: "Dagaz - daybreak, a new stop on the road" },
  market: { name: "Market", subtitle: "", rune: "ᚠ", meaning: "Fehu - wealth" },
  ledger: { name: "The Ledger", subtitle: "", rune: "ᛟ", meaning: "Othala - inheritance" },
  merchant: { name: "The merchant", subtitle: "", rune: "ᚲ", meaning: "Kenaz - the torch, the craftsman" },
  road: { name: "The road on", subtitle: "", rune: "ᚱ", meaning: "Raido - the journey" },
  heroes: { name: "Heroes for sale", subtitle: "", rune: "ᚢ", meaning: "Uruz - strength" },
  gear: { name: "Gear for sale", subtitle: "", rune: "ᚷ", meaning: "Gebo - the gift" },
  squad: { name: "Your squad", subtitle: "", rune: "ᛗ", meaning: "Mannaz - the people" },
  hq: { name: "Headquarters", subtitle: "", rune: "ᛞ", meaning: "Dagaz - daybreak" },
  hqCommander: { name: "Commander", subtitle: "", rune: "ᛏ", meaning: "Tiwaz - the warrior" },
  hqRelics: { name: "Relics & bag", subtitle: "", rune: "ᛟ", meaning: "Othala - inheritance" },
  hqFight: { name: "In the fight", subtitle: "", rune: "ᛗ", meaning: "Mannaz - the people" },
  hqReserve: { name: "Reserve", subtitle: "", rune: "ᛜ", meaning: "Ingwaz - what waits to grow" },
  hqRoad: { name: "The road", subtitle: "", rune: "ᚱ", meaning: "Raido - the journey" },
  hqBuild: { name: "Your build", subtitle: "", rune: "ᛉ", meaning: "Algiz - protection" },
  hqMarket: { name: "The market", subtitle: "", rune: "ᚲ", meaning: "Kenaz - the torch, the craftsman" },
  visitMarket: { name: "Visit the market", subtitle: "Heroes, gear, the Ledger", rune: "", meaning: "" },
}

// Safe lookup: a missing or half-edited entry still renders something.
export function marketUiText(key) {
  const entry = MARKET_UI[key] || {}
  return {
    name: entry.name || key,
    subtitle: entry.subtitle || "",
    rune: entry.rune || "",
    meaning: entry.meaning || "",
  }
}
