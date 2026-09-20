// Hearthwood Studio: reorderable + free-position Market layout. Marc:
// "haluaisin siirtää market osiossa nappeja ja asioita eri
// paikkoihin... se voisi toimia kuin wordpress elementeillä joita voin
// liikuttaa ja muokata vapaasti" (I'd like to move buttons and things
// around in the market section... it could work like WordPress with
// elements I can move and edit freely). First shipped as REORDERING
// only (leftRailOrder, up/down); Marc then asked for the next level -
// "haluan tämän raahaa mihin tahansa tasolle" (I want this at the
// drag-it-anywhere level) - true free positioning, not just order.
//
// SquadDraft.jsx's left rail (the "owned" column: what you already
// have) renders these 4 named sections. `leftRailOrder` still decides
// DOM/tab order and paint order (which section draws on top if two
// ever overlap) and is what's used under the narrow-viewport
// breakpoint (<=1240px, where the 3-column layout collapses to one
// column and free positions don't apply). `leftRailPositions` is the
// NEW optional field: when ALL 4 keys have an {x, y} entry, the rail
// switches to free positioning (dragged live on the Market screen
// itself, via the dev-only "Edit Layout" toggle); if even one key is
// missing (including the default, untouched case), the rail renders
// exactly as before via the plain order-based flow - one clean
// all-or-nothing check, not two layout systems half-active at once.
// Anything not recognized in either field is simply skipped, so a
// typo here can't crash the market.
export const SHOP_LAYOUT = {
  market: {
    id: "market",
    leftRailOrder: ["ledger", "buyback", "relics", "items"],
    leftRailPositions: {},
  },
}
