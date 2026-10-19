// Pure checks for wishRouter.js (Hearthwood HQ "What do you want today?").
import { routeWish, searchWords } from "../src/components/hearthwood-studio/wishRouter.js"
const SEARCH = [
  { type: "commanders", id: "tommy", name: null },
  { type: "units", id: "tommy-cat", name: "Tommy" },
  { type: "storyScenes", id: "rootkeeper-gate", name: "The Rootkeeper's Gate" },
  { type: "enemies", id: "rotwood-husk", name: "Rotwood Husk" },
]
const cases = [
  ["vaihda Tommyn kuva", "open", (r) => String(r.entity?.id).startsWith("tommy")],
  ["haluan muuttaa Rotwood Huskista vahvemman", "change", (r) => r.entity?.id === "rotwood-husk"],
  ["tee uusi tapahtuma metsään", "add", (r) => r.type === "events"],
  ["luo uusi dialogi kauppiaalle", "add", (r) => r.type === "dialogues"],
  ["lisää taistelukentälle uusi ampiaispesä", "add", (r) => r.type === "battleObjects"],
  ["luo uusi pelattava metsänhenkiluokka jolla on jäätaikoja", "needsCode", (r) => r.what === "a new hero class"],
  ["haluan uuden mekaniikan jossa jäätaika jäädyttää veden", "needsCode", (r) => r.what === "a new game mechanic or rule"],
  ["tee uusi sankari", "clone", (r) => r.type === "units"],
  ["muuta pelin värejä lämpimämmiksi", "view", (r) => r.view === "theme"],
  ["avaa Rootkeeper's Gate", "open", (r) => r.entity?.id === "rootkeeper-gate"],
  ["make the Rotwood Husk tougher", "change", (r) => r.entity?.id === "rotwood-husk"],
  ["tee Rotwood Huskista kalliimpi", "change", (r) => r.entity?.id === "rotwood-husk"],
  ["hmm", "unclear", () => true],
  ["", "unclear", () => true],
]
let fail = 0
for (const [text, kind, extra] of cases) {
  const r = routeWish(text, SEARCH.filter((s) => searchWords(text).some((w) => String(s.name || s.id).toLowerCase().includes(w) || s.id.includes(w))))
  const ok = r.kind === kind && extra(r)
  if (!ok) fail++
  console.log(ok ? "PASS" : "FAIL", JSON.stringify(text), "->", r.kind, r.entity?.id || r.type || r.what || r.view || "")
}
console.log(fail ? `FAIL ${fail}` : "ALL PASS")
