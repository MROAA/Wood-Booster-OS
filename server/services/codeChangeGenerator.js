/*
 * Wood-Booster HQ
 * Boosterverse
 *
 * Code Change Generator
 *
 * Sama malli kuin pythonCodeRefactorer.js, mutta yleistettynä mihin
 * tahansa projektin sallittuun tiedostotyyppiin (ks.
 * plugins/CodeChangeDeveloper/skills/projectSandbox.js) ja
 * tukemaan sekä olemassa olevan tiedoston muokkausta että uuden
 * tiedoston luontia (currentCode voi olla null).
 *
 * Vastaus pyydetään aina koko tiedoston uutena sisältönä, ei
 * diffinä - pienet paikalliset mallit eivät tuota luotettavasti
 * syntaktisesti oikeita unified diffejä (rivinumerot, hunk-otsikot,
 * täsmälliset kontekstirivit). Todellinen diff lasketaan sen sijaan
 * deterministisesti palvelimella (ks. routes/devCodeChangeStudio.js)
 * kahdesta täydestä tekstistä - näin kirjoitusvaihe on aina täsmälleen
 * se mitä Marc hyväksyi, eikä koskaan patch-sovelluksen tulos.
 */

import { chatWithOllama } from "./ollamaClient.js"

const DEFAULT_MODEL =
  process.env.CODE_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b"

/*
 * ES module -vaatimus koskee vain .js/.ts-tiedostoja - .jsx/.tsx
 * (React-komponentit), .json/.md/.css/.html/.prisma/.py eivät käytä
 * import/export-syntaksia samalla tavalla eikä ohjetta pidä lisätä
 * niille. Lisätty sen jälkeen kun havaittiin manuaalisessa
 * hyväksymistestissä, että malli tuotti CommonJS-koodia
 * (module.exports) vaikka projektin oma CLAUDE.md vaatii ES moduulit
 * - tämä ristiriita esti generoitua tarkistustestiä (joka aina
 * käyttää import-syntaksia, ks. verificationTestGenerator.js)
 * koskaan läpäisemästä.
 */
function requiresEsModules(filePath) {
  return /\.(js|ts)$/i.test(filePath || "")
}

function buildSystemPrompt(filePath) {
  return (
    `TEHTÄVÄ: Muokkaa Wood-Booster HQ -projektin tiedostoa ` +
    `"${filePath}" annetun pyynnön mukaisesti. Sinulle annetaan ` +
    "tiedoston NYKYINEN koko sisältö (tai maininta, ettei tiedostoa " +
    "vielä ole). Tee VAIN pyydetty muutos - älä muuta mitään muuta, " +
    "älä lisää selityksiä koodin sekaan, älä poista toiminnallisuutta " +
    "jota pyyntö ei koske. Jos tiedostoa ei vielä ole, luo se " +
    "kokonaan pyynnön perusteella. " +
    (
      requiresEsModules(filePath)
        ? "Käytä AINA ES-moduulisyntaksia (import/export) - älä " +
          "koskaan CommonJS-syntaksia (require/module.exports). "
        : ""
    ) +
    "Vastaa TARKALLEEN tässä muodossa:\n" +
    "OTSIKKO: <lyhyt kuvaava otsikko>\n" +
    "SELITYS: <lyhyt suomenkielinen kuvaus tehdystä muutoksesta>\n" +
    "KOODI:\n" +
    "```\n" +
    "# TIEDOSTO ALKAA TÄSTÄ\n" +
    "<koko tiedoston uusi sisältö kokonaisuudessaan>\n" +
    "```\n" +
    "TÄRKEÄÄ: rivi \"# TIEDOSTO ALKAA TÄSTÄ\" on vain merkki sisällön " +
    "alusta, ei osa tiedostoa - kirjoita sen JÄLKEEN tiedoston oma " +
    "sisältö kokonaisuudessaan alusta asti."
  )
}

export function parseCodeChangeText(text) {
  const titleMatch = text.match(
    /OTSIKKO:\s*([\s\S]*?)(?:\nSELITYS:|\n```|\nKOODI:|$)/i,
  )

  const explanationMatch = text.match(
    /SELITYS:\s*([\s\S]*?)(?:\n```|\nKOODI:|$)/i,
  )

  const codeBlockMatch = text.match(
    /```(?:\w+)?\s*\n([\s\S]*?)```/i,
  )

  const fallbackCodeMatch = text.match(/KOODI:\s*([\s\S]*)$/i)

  const rawCode = codeBlockMatch
    ? codeBlockMatch[1].trim()
    : (fallbackCodeMatch ? fallbackCodeMatch[1].trim() : text.trim())

  const code = rawCode.replace(/^#\s*TIEDOSTO ALKAA TÄSTÄ\s*\n/i, "")

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    explanation: explanationMatch ? explanationMatch[1].trim() : "",
    code,
  }
}

/*
 * Suojaus samaa vikaa vastaan kuin pythonCodeRefactorer.js:ssä -
 * malli voi joskus palauttaa kirjaimellisesti kehotteen oman
 * placeholder-tekstin koodina takaisin oikean sisällön sijaan.
 */
function looksLikeValidCode(code) {
  const trimmed = (code || "").trim()

  if (trimmed.length < 1) {
    return false
  }

  if (/^<[^<>]*>$/.test(trimmed)) {
    return false
  }

  return true
}

const MAX_ATTEMPTS = 2

/*
 * Ehdottaa muutosta annettuun tiedostoon (tai luo sen, jos
 * currentCode on null). Ei koskaan kirjoita mihinkään itse -
 * palauttaa vain ehdotetun sisällön, otsikon ja selityksen, jonka
 * kutsuja tallentaa CodeChangeDraftiksi ihmisen hyväksyttäväksi.
 */
export async function generateCodeChange({
  prompt,
  currentCode,
  filePath,
  model = DEFAULT_MODEL,
}) {
  const userMessage =
    `NYKYINEN SISÄLTÖ:\n${
      currentCode === null || currentCode === undefined
        ? "(tiedostoa ei ole vielä olemassa)"
        : currentCode
    }\n\nPYYNTÖ:\n${prompt}`

  let parsed = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const rawText = await chatWithOllama({
      model,
      systemPrompt: buildSystemPrompt(filePath),
      userMessage,
      // Vastauksen pitää sisältää KOKO tiedosto uudelleen, ei vain
      // muutos - pyyntö (koko nykyinen sisältö) + vastaus (koko uusi
      // sisältö) voi siis olla lähes kaksinkertainen tiedoston koko.
      // Oletus 4096 katkaisi vastauksen kesken isommilla tiedostoilla
      // kuten README.md - havaittu manuaalisessa hyväksymistestissä.
      numCtx: 16384,
    })

    parsed = parseCodeChangeText(rawText)

    if (looksLikeValidCode(parsed.code)) {
      break
    }

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(
        "AI ei pystynyt tuottamaan kelvollista ehdotusta " +
          `${MAX_ATTEMPTS} yrityksellä. Kokeile uudelleen.`,
      )
    }
  }

  return {
    title: parsed.title || "Koodimuutos",
    explanation: parsed.explanation,
    code: parsed.code,
    model,
  }
}
