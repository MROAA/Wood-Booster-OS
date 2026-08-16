/*
WOOD-BOOSTER HQ

SPACEMONKEY MODULE ROUTE GENERATOR

Käyttö:

  node scripts/generate-module-route.js <ModuleDirName>

Lukee server/services/spacemonkey/modules/<ModuleDirName>/index.js:n
oikeat export-nimet (dynaaminen import, ei arvausta), päättelee jokaisen
funktion todennäköisen REST-muodon nimikäytännöstä (get-, find- ja
ByX-alkuiset = GET, create-, add-, analyze-, evaluate- yms alkuiset =
POST), ja tulostaa konsoliin:

1. valmiin route-tiedoston sisällön (samassa tyylissä kuin muut jo
   käsin kirjoitetut spacemonkey-reitit)
2. kaksi riviä jotka pitää lisätä server/index.js:ään (import +
   app.use)

Ei kirjoita mihinkään tiedostoon eikä muuta server/index.js:ää
itsestään - tulostaa vain ehdotuksen, joka luetaan ja tarkistetaan
käsin ennen tallentamista, samaa "generoi luonnos, ihminen hyväksyy"
-periaatetta noudattaen kuin CodeChangeDeveloper-plugin.
*/

import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const moduleName = process.argv[2]

if (!moduleName) {
  console.error("Käyttö: node scripts/generate-module-route.js <ModuleDirName>")
  process.exit(1)
}

const modulePath = path.join(
  __dirname,
  "..",
  "services",
  "spacemonkey",
  "modules",
  moduleName,
  "index.js",
)

const mod = await import(pathToFileURL(modulePath).href)

const exportNames = Object.keys(mod).filter((name) => name !== "MODULE_ID" && typeof mod[name] === "function")

if (exportNames.length === 0) {
  console.error(`Ei löytynyt funktioita moduulista ${moduleName} (tarkista polku ja export-lause).`)
  process.exit(1)
}

const READ_PREFIXES = ["get", "find", "search", "list"]
const WRITE_PREFIXES = [
  "create", "add", "analyze", "evaluate", "approve", "reject", "run",
  "check", "route", "handle", "subscribe", "publish", "execute", "update",
  "compare", "verify", "restore", "initialize", "process", "recognize",
]

function classify(name) {
  if (READ_PREFIXES.some((p) => name.startsWith(p))) return "GET"
  if (WRITE_PREFIXES.some((p) => name.startsWith(p))) return "POST"
  return "GET"
}

function kebabCase(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

function subPathFor(name) {
  if (/Latest/.test(name)) return "/latest"
  const byMatch = name.match(/By([A-Z][a-zA-Z]*)$/)
  if (byMatch) return null // handled as a ?query filter on the base path instead
  if (name.startsWith("find")) return "/:id"
  return null
}

const baseSlug = kebabCase(moduleName.replace(/^creator|^spacemonkey/, "")).replace(/^-/, "")
const basePath = `/spacemonkey/${moduleName.startsWith("creator") ? "creator/" : ""}${baseSlug}`

console.log(`\n=== Ehdotettu perus-URL: ${basePath} ===`)
console.log(`(tarkista tämä ensin - generaattori ei tiedä onko tämä jo käytössä toisella moduulilla)\n`)

console.log("--- Export-luokittelu (tarkista ennen käyttöä) ---")
for (const name of exportNames) {
  console.log(`  ${classify(name).padEnd(4)} ${name}${subPathFor(name) ? "  -> " + subPathFor(name) : ""}`)
}

const routerFnName = `createSpacemonkey${moduleName.charAt(0).toUpperCase()}${moduleName.slice(1)}Router`

console.log(`\n--- Muista lisätä server/index.js:ään ---`)
console.log(`import {\n  ${routerFnName},\n} from "./routes/spacemonkey${moduleName.charAt(0).toUpperCase()}${moduleName.slice(1)}.js"`)
console.log(`\napp.use(\n  "/api",\n  ${routerFnName}()\n)`)

console.log(`\n--- HUOM ---`)
console.log(`Tämä on vain nopea luonnos export-nimien perusteella. Lue oikea`)
console.log(`server/services/spacemonkey/modules/${moduleName}/index.js käsin ennen`)
console.log(`route-tiedoston kirjoittamista - erityisesti mitä parametreja kukin`)
console.log(`funktio oikeasti ottaa (req.body vs req.params.id vs ei mitään) ja`)
console.log(`onko jokin export tarkoitettu sisäiseksi apufunktioksi eikä omaksi`)
console.log(`reitiksi (esim. recognizeDecisionPattern otti toisen moduulin dataa`)
console.log(`parametrina, ei ollut itsenäinen reitti).`)
