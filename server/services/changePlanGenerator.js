/*
 * Wood-Booster HQ
 * Boosterverse
 *
 * Change Plan Generator
 *
 * Sama Ollama-kutsu/jäsennys/uudelleenyritys-rakenne kuin
 * codeChangeGenerator.js:ssä, mutta tuottaa SUUNNITELMAN (mitkä
 * tiedostot ja miksi) ennen kuin yksikään tiedoston sisältö
 * generoidaan. Marc valitsi tämän nimenomaan: Spacemonkey ehdottaa
 * ensin listan tarvittavista tiedostoista, ja vasta listan
 * hyväksymisen jälkeen kunkin tiedoston sisältö generoidaan erikseen
 * (uudelleenkäyttäen olemassa olevaa generateCodeChangeSkill/
 * generateVerificationTestSkill/runVerificationTestSkill-ketjua per
 * tiedosto - ks. devMultiFileChangeStudio.js).
 *
 * Vastaus pyydetään yksinkertaisena rivipohjaisena listana JSON:n
 * sijaan - sama syy kuin codeChangeGenerator.js:ssä: pienet
 * paikalliset mallit ovat epäluotettavampia tuottamaan validia JSONia
 * kuin yksinkertaista, kiinteämuotoista tekstiä.
 */

import { chatWithOllama } from "./ollamaClient.js"

const DEFAULT_MODEL =
  process.env.CODE_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b"

/*
 * Kevyt, kiinteä kuvaus projektin tyypillisistä konventioista - ei
 * dynaamista koodikannan tutkimista (se olisi paljon isompi erillinen
 * ominaisuus). Auttaa mallia ehdottamaan polkuja jotka noudattavat
 * projektin todellista rakennetta sen sijaan että se arvaisi
 * mielivaltaisia hakemistoja.
 */
const PROJECT_CONVENTIONS = (
  "Wood-Booster HQ -projektin rakenne:\n" +
  "- React-sivut: src/pages/<Nimi>.jsx\n" +
  "- Jaetut komponentit: src/components/<alue>/<Nimi>.jsx\n" +
  "- Reitit rekisteröidään src/App.jsx:ssä (react-router-dom <Route>)\n" +
  "- Sivupalkin linkit: src/components/layout/Sidebar.jsx\n" +
  "- Backend-reitit: server/routes/<nimi>.js\n" +
  "- Backend-palvelut: server/services/<nimi>.js\n"
)

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Käyttäjä pyytää muutosta Wood-Booster HQ -projektiin, " +
    "joka saattaa vaatia useamman tiedoston muokkaamista tai luomista " +
    "yhdessä. Tee SUUNNITELMA - älä vielä kirjoita mitään koodia. " +
    "Listaa täsmälleen ne tiedostot jotka tarvitaan, kunkin " +
    "tiedostopolku, onko kyseessä uuden tiedoston luonti vai " +
    "olemassa olevan muokkaus, ja lyhyt syy miksi juuri tämä tiedosto " +
    "tarvitaan. Pidä suunnitelma mahdollisimman pienenä - älä lisää " +
    "tiedostoja joita pyyntö ei oikeasti vaadi.\n\n" +
    PROJECT_CONVENTIONS +
    "\nVastaa TARKALLEEN tässä muodossa (yksi rivi per tiedosto):\n" +
    "SUUNNITELMA:\n" +
    "- LUO: <tiedostopolku> | <lyhyt syy>\n" +
    "- MUOKKAA: <tiedostopolku> | <lyhyt syy>\n" +
    "SELITYS: <yhden lauseen yleiskuvaus koko suunnitelmasta>"
  )
}

export function parseChangePlanText(text) {
  const lines = text.split("\n")

  const files = []

  const lineRegex = /^-\s*(LUO|MUOKKAA)\s*:\s*(.+?)\s*\|\s*(.+)$/i

  for (const line of lines) {
    const match = line.trim().match(lineRegex)

    if (!match) {
      continue
    }

    files.push({
      action: match[1].toUpperCase() === "LUO" ? "create" : "modify",
      filePath: match[2].trim(),
      reason: match[3].trim(),
    })
  }

  const explanationMatch = text.match(/SELITYS:\s*([\s\S]*)$/i)

  return {
    files,
    explanation: explanationMatch ? explanationMatch[1].trim() : "",
  }
}

const MAX_ATTEMPTS = 2

/*
 * Ehdottaa suunnitelman (tiedostolistan) annetulle pyynnölle. Ei
 * koskaan generoi tiedostosisältöä eikä kirjoita mihinkään - vain
 * palauttaa listan, jonka kutsuja tallentaa CodeChangeDraftSetiksi
 * ihmisen hyväksyttäväksi ennen kuin yksittäisten tiedostojen sisältö
 * generoidaan.
 */
export async function generateChangePlan({
  prompt,
  model = DEFAULT_MODEL,
}) {
  let parsed = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const rawText = await chatWithOllama({
      model,
      systemPrompt: buildSystemPrompt(),
      userMessage: prompt,
    })

    parsed = parseChangePlanText(rawText)

    if (parsed.files.length > 0) {
      break
    }

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(
        "AI ei pystynyt tuottamaan kelvollista suunnitelmaa " +
          `${MAX_ATTEMPTS} yrityksellä. Kokeile tarkentaa pyyntöä.`,
      )
    }
  }

  return {
    files: parsed.files,
    explanation: parsed.explanation,
  }
}
