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
// optional field: when ALL 4 keys have an {x, y} entry, the rail
// switches to free positioning (dragged live on the Market screen
// itself, via the dev-only "Edit Layout" toggle); if even one key is
// missing (including the default, untouched case), the rail renders
// exactly as before via the plain order-based flow - one clean
// all-or-nothing check, not two layout systems half-active at once.
// Anything not recognized in either field is simply skipped, so a
// typo here can't crash the market.
//
// Phase 2 (Marc: "i want to be able to move all of the pieces how i
// like"): `rightRailPositions` is the SAME mechanism for the right
// rail, which today holds exactly one element - the live run map -
// under the key "map". Kept as its own keyed object (not a bare
// {x,y}) purely for consistency with `leftRailPositions`'s own shape,
// so the same reader/editor logic and the same Studio field-editing
// UI cover both without a special case. The center market/squad panel
// deliberately does NOT get free positioning (investigated and
// confirmed too risky as-is: a fluid-width column holding two
// differently-shaped panels that swap via a tab, with unstable height
// and a card component that already drives its own hover animation).
//
// Phase 3 (Marc, choosing between "free positioning" and "simple
// reordering" for the center column specifically): `centerOrder` is
// the SAME plain reordering mechanism `leftRailOrder` already uses -
// no coordinates, so none of the free-positioning risk above applies.
// It only covers the "chrome" ABOVE the actual shop content (the
// merchant's line, the tutorial/evolution/equip/market-event notices,
// the Market/Your Squad tab row) - the tab-swapped panels themselves
// (hw-market-columns) and the Continue button stay fixed structural
// anchors, not reorderable pieces, so reordering this list can never
// move the shop's actual contents or its exit button around.
export const SHOP_LAYOUT = {
  market: {
    id: "market",
    leftRailOrder: ["ledger", "buyback", "relics", "items"],
    leftRailPositions: {},
    rightRailPositions: {},
    centerOrder: ["greeting", "tutorialHint", "evolutionNotice", "tabs", "equipPrompt", "marketEventBanner"],
  },
}
