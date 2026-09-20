// Hearthwood Studio: reorderable Market layout. Marc: "haluaisin
// siirtää market osiossa nappeja ja asioita eri paikkoihin... se voisi
// toimia kuin wordpress elementeillä joita voin liikuttaa ja muokata
// vapaasti" (I'd like to move buttons and things around in the market
// section... it could work like WordPress with elements I can move and
// edit freely). A true free-drag-anywhere page-builder would be a
// large new subsystem and easily breaks on different screen sizes;
// asked which direction fit best, Marc picked the more durable middle
// ground: reordering whole named sections, not pixel-perfect dragging.
//
// SquadDraft.jsx's left rail (the "owned" column: what you already
// have) renders these 4 named sections in whatever order
// `leftRailOrder` lists them - editable here like any other Studio
// list field (move an entry up/down, preview, apply). Anything not
// recognized is simply skipped, so a typo here can't crash the market.
export const SHOP_LAYOUT = {
  market: {
    id: "market",
    leftRailOrder: ["ledger", "buyback", "relics", "items"],
  },
}
