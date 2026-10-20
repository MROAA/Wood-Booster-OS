// Lantern light radius grows with the lantern's oil level.
export function lightRadius(lantern) {
  return 1 + Math.floor(lantern.oil / 3)
}
