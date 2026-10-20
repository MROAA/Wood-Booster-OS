// Herb definitions: how much each herb heals and how many fit in one stack.
export const HERBS = {
  sunleaf: { name: "Sunleaf", heal: 4, stackMax: 3 },
  moonroot: { name: "Moonroot", heal: 7, stackMax: 2 },
}

export function herbDef(herbId) {
  return HERBS[herbId] || null
}
