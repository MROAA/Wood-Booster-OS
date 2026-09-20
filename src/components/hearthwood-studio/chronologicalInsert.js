// Shared by every "write a brand-new story thing" form (AddStoryEntryForm.jsx,
// AddEventForm.jsx, ...): given a type's own entities (already in the
// file's Act 1->7 declaration order, per the chronological-reorder
// rounds) and a target Act, finds which existing entity's id the new
// one should be inserted AFTER (hearthwood-apply-edit.mjs's
// insertAfterKey op) so it lands in the correct chronological spot
// instead of always at the end. Extracted once two call sites needed
// the identical logic - this session's own recurring lesson is that a
// SECOND copy of the same logic drifts out of sync with the first.
export function insertionPointFor(entities, targetAct) {
  let afterKey = null

  for (const entity of entities) {
    const act = entity.fields?.act?.value

    if (typeof act === "number" && act <= targetAct) {
      afterKey = entity.id
    }
  }

  return afterKey
}
