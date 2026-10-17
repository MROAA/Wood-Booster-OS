// The camp at a glance - the one line both Headquarters and the Market
// show in the middle of their top bar.
//
// Purpose: say the single thing to know before setting out: a place in
// the fight stands empty, who is hurt, or that the camp is ready.
// Dependencies: runEngine (DEPLOY_SLOTS, unitHpPct), units (names).
// Public API: campStatus({ deployedEntries, deployedCount, reserveCount, where })
//   -> { state: "warn" | "hurt" | "ready", rune, text, short }
//   `short` is the same news without the "what to do" half, for a crowded bar.
//   `where` names the place the player is in: "hq" (fix it right here) or
//   "market" (fix it back in Headquarters).
// Example: campStatus({ deployedEntries, deployedCount: 3, reserveCount: 1, where: "hq" })
//   -> { state: "warn", rune: "ᛗ", text: "A place in the fight stands empty - call a hero from the reserve" }
import { DEPLOY_SLOTS, unitHpPct } from "../../services/heartwood/runEngine"
import { UNITS } from "../../data/heartwood/units"

export const STATUS_RUNE = { ready: "ᛞ", hurt: "ᚢ", warn: "ᛗ", pick: "ᛗ" }

export function campStatus({ deployedEntries, deployedCount, reserveCount, where = "hq" }) {
  const empty = Math.max(0, DEPLOY_SLOTS - deployedCount)
  if (empty > 0) {
    const fix = reserveCount > 0 ? (where === "hq" ? " - call a hero from the reserve" : " - fill it in Headquarters") : " - recruit a hero"
    return {
      state: "warn",
      rune: STATUS_RUNE.warn,
      text: `${empty === 1 ? "A place" : `${empty} places`} in the fight ${empty === 1 ? "stands" : "stand"} empty${fix}`,
      short: `${empty === 1 ? "A place" : `${empty} places`} in the fight ${empty === 1 ? "stands" : "stand"} empty`,
    }
  }
  const hurt = deployedEntries
    .filter((e) => unitHpPct(e) < 1 || e.wounded)
    .map((e) => UNITS[e.defId]?.name)
    .filter(Boolean)
  if (hurt.length > 0) {
    const who = hurt.length === 1 ? `${hurt[0]} is` : hurt.length === 2 ? `${hurt[0]} and ${hurt[1]} are` : `${hurt.length} heroes are`
    return { state: "hurt", rune: STATUS_RUNE.hurt, text: `${who} hurt - ${where === "hq" ? "mend at the workbench" : "mend in Headquarters"}`, short: `${who} hurt` }
  }
  return { state: "ready", rune: STATUS_RUNE.ready, text: "The camp is ready to set out", short: "The camp is ready to set out" }
}
