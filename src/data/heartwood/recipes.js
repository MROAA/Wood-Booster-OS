// Hearthwood - GEAR RECIPES (the gear sprint). Class Collars: collars.js.
// Pure data - Studio-editable (Hearthwood Studio > 🎒 Gear). The rules
// live in services/heartwood/gear.js.
//
// As a player reads it:
// - RECIPES: put the two ingredients NEXT TO each other in one hero's
//   gear row and they fuse into the result (the left slot keeps it).
//   Recipes whose two ingredients are the same item also fuse the moment
//   you BUY a second copy. A recipe you have made once is "known": the
//   Hearth's Workshop can craft it again between runs.
// Recipe fields: id, a, b (ingredient item ids, order doesn't matter),
// result (item id in items.js), text (plain-English hint).

// Acorns the Hearth's Workshop charges to craft a known recipe from two
// stashed ingredients.
export const RECIPE_CRAFT_ACORNS = 4

export const RECIPES = {
  "twin-fangs": { id: "twin-fangs", a: "bone-dagger", b: "bone-dagger", result: "twin-fangs", text: "Two Bone Daggers side by side (or buy a second one) become Twin Fangs." },
  "keen-blade": { id: "keen-blade", a: "whetstone", b: "iron-blade", result: "keen-blade", text: "A Whetstone next to an Iron Blade grinds it into a Keen Blade." },
  "healing-draught": { id: "healing-draught", a: "herb-pouch", b: "empty-flask", result: "healing-draught", text: "A Herb Pouch next to an Empty Flask brews a Healing Draught." },
  "mana-heart": { id: "mana-heart", a: "mana-gem", b: "mana-gem", result: "mana-heart", text: "Two Mana Gems side by side (or buy a second one) fuse into a Mana Heart." },
  "wellspring-staff": { id: "wellspring-staff", a: "oak-staff", b: "mana-gem", result: "wellspring-staff", text: "A Mana Gem set into an Oak Staff makes a Wellspring Staff." },
  "grove-censer": { id: "grove-censer", a: "incense-burner", b: "herb-pouch", result: "grove-censer", text: "Herbs in an Incense Burner make a Grove Censer." },
  "ironbark-guard": { id: "ironbark-guard", a: "padded-vest", b: "buckler", result: "ironbark-guard", text: "A Buckler strapped to a Padded Vest makes an Ironbark Guard." },
  "fortune-rune": { id: "fortune-rune", a: "lucky-charm", b: "rune-stone", result: "fortune-rune", text: "A Lucky Charm carved into a Rune Stone makes a Fortune Rune." },
}
