// Where each squad action lives - the one place that decides it.
//
// Marc: "asiat on eroteltu niille sivuille mihin ne kuuluu loogisesti" and
// "kehitä asioille samalla systeemi jotta niitä on helpompi kehittää
// jatkossakin". The rule (docs/hearthwood-visual-theme.md, "Where things go"):
//   market - a trade with the merchant (buy, sell, reforge, buy back)
//   camp   - looking after your own squad in Headquarters (gear, fusion
//            progress, upgrade, mend)
// The classic Market layout still shows every action on its cards.
//
// Purpose: renderBenchCard (Headquarters cards) and renderTradeRow (the
// Market's "Trade your heroes" panel) ask actionShownAt(action, place)
// instead of hard-coding it. A new hero action = add one line here and
// read it in the place that draws it.
// Public API: SQUAD_ACTIONS, actionShownAt(action, place)
// Example: actionShownAt("sell", "camp") -> false

export const SQUAD_ACTIONS = {
  gear: { places: ["camp"], why: "equipping your own heroes" },
  fusion: { places: ["camp"], why: "progress toward the next tier" },
  upgrade: { places: ["camp"], why: "training at camp" },
  mend: { places: ["camp"], why: "healing at camp" },
  reforge: { places: ["market"], why: "swapped through the merchant" },
  sell: { places: ["market"], why: "sold to the merchant" },
}

// `place`: "camp" (Headquarters), "market" (the Market screen) or
// "classic" (the old tabbed layout - shows everything).
export function actionShownAt(action, place) {
  if (place === "classic") return true
  return !!SQUAD_ACTIONS[action]?.places.includes(place)
}
