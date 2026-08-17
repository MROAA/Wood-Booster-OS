import { isValidPythonSyntax } from "./pythonSyntaxValidator.js"

import { chatWithOllama } from "./ollamaClient.js"

/*
 * Sama peruste kuin pythonCodeRefactorer.js - virheen diagnosointi
 * ja korjausehdotuksen kirjoittaminen on koodin ymmärtämistä, ei
 * sujuvaa suomenkielistä proosaa, joten koodiin erikoistunut malli
 * sopii tähän paremmin kuin FINNISH_CONTENT_MODEL.
 */
const DEFAULT_MODEL =
  process.env.PYTHON_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Annettu Python-koodi ja mahdollinen virheilmoitus/" +
    "kuvaus ongelmasta. Selitä LYHYESTI mikä todennäköisesti " +
    "aiheuttaa ongelman, ja tuota korjattu versio KOKO tiedostosta " +
    "MUUTTAMATTA muuta toiminnallisuutta kuin mitä korjaus vaatii. " +
    "Jos et löydä mitään korjattavaa annetun tiedon perusteella, " +
    "sano niin suoraan äläkä keksi ongelmaa - palauta silloin koodi " +
    "muuttumattomana. " +
    "Vastaa TARKALLEEN tässä muodossa:\n" +
    "OTSIKKO: <lyhyt kuvaava otsikko>\n" +
    "DIAGNOOSI: <lyhyt selitys todennäköisestä syystä ja korjauksesta>\n" +
    "KOODI:\n" +
    "```python\n" +
    "# TIEDOSTO ALKAA TÄSTÄ\n" +
    "<koko korjattu tiedosto>\n" +
    "```\n" +
    "TÄRKEÄÄ: rivi \"# TIEDOSTO ALKAA TÄSTÄ\" on vain merkki koodin " +
    "alusta, ei osa tiedostoa - kirjoita sen JÄLKEEN tiedoston oma " +
    "sisältö kokonaisuudessaan alusta asti, myös jos tiedosto alkaa " +
    "kolmoislainausmerkillä (\"\"\") - älä koskaan jätä sitä pois vain " +
    "koska se muistuttaa koodilohkon omaa ```-rajaa."
  )
}

function buildUserMessage({ code, errorMessage }) {
  if (!errorMessage || !errorMessage.trim()) {
    return (
      "Ei virheilmoitusta annettu - etsi koodista mahdollisia " +
      "bugeja omin päin.\n\nKOODI:\n" + code
    )
  }

  return (
    "VIRHEILMOITUS TAI ONGELMAN KUVAUS:\n" + errorMessage.trim() +
    "\n\nKOODI:\n" + code
  )
}

export function parseDebugText(text) {
  // Pysähdytään ennemmin koodilohkon alkuun (```) kuin
  // kirjaimelliseen "KOODI:"-tekstiin, koska malli ei aina
  // noudata kehotteen tarkkaa muotoilua (havaittu esim.
  // "KORJATTU KODI:" pelkän "KOODI:"n sijaan) - koodilohkon
  // aloitusmerkki on paljon luotettavampi raja.
  const titleMatch = text.match(
    /OTSIKKO:\s*([\s\S]*?)(?:\nDIAGNOOSI:|\n```|\nKOODI:|$)/i,
  )

  const diagnosisMatch = text.match(
    /DIAGNOOSI:\s*([\s\S]*?)(?:\n```|\nKOODI:|$)/i,
  )

  const codeBlockMatch = text.match(
    /```(?:python)?\s*\n([\s\S]*?)```/i,
  )

  const fallbackCodeMatch = text.match(/KOODI:\s*([\s\S]*)$/i)

  const rawCode = codeBlockMatch
    ? codeBlockMatch[1].trim()
    : (fallbackCodeMatch ? fallbackCodeMatch[1].trim() : text.trim())

  // Poistetaan kehotteen oma "# TIEDOSTO ALKAA TÄSTÄ" -merkkirivi, jos
  // malli toistaa sen kirjaimellisesti - katso perustelu
  // buildSystemPrompt()-funktiosta: rivi on olemassa jotta malli ei
  // sekoita koodilohkon ```-rajaa tiedoston omaan alkavaan
  // kolmoislainausmerkkiin, mutta se ei itse ole osa tiedostoa.
  const code = rawCode.replace(/^#\s*TIEDOSTO ALKAA TÄSTÄ\s*\n/i, "")

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    diagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : "",
    code,
  }
}

/*
 * Suojaus havaittua todellista vikaa vastaan: malli palauttaa
 * joskus (havaittu käsin ~1/3 yrityksistä) kirjaimellisesti
 * kehotteen oman placeholder-tekstin ("<koko korjattu tiedosto>")
 * koodina takaisin sen sijaan että kirjoittaisi oikeaa koodia.
 * Hylätään selvästi placeholder-näköinen tai epäilyttävän lyhyt
 * tulos, jotta sitä ei koskaan tallenneta luonnokseksi sellaisenaan.
 */
function looksLikeValidCode(code) {
  const trimmed = (code || "").trim()

  if (trimmed.length < 10) {
    return false
  }

  if (/^<[^<>]*>$/.test(trimmed)) {
    return false
  }

  return true
}

/*
 * Diagnosoi annetun Python-koodin ongelman (ja valinnaisen
 * virheilmoituksen) ja ehdottaa korjatun version. Ei koskaan aja
 * koodia - pelkkä lukemiseen ja päättelyyn perustuva diagnoosi,
 * samaan tapaan kuin ihminen lukisi virheilmoituksen ja koodin ja
 * arvaisi syyn ilman debuggeria. Ei koskaan kirjoita mihinkään
 * itse - kutsuja tallentaa tuloksen PythonCodeDraftiksi ihmisen
 * hyväksyttäväksi, sama malli kuin refactor-python.
 */
const MAX_ATTEMPTS = 2

export async function debugPythonCode({
  code,
  errorMessage = "",
  model = DEFAULT_MODEL,
}) {
  let lastParsed = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const rawText = await chatWithOllama({
      model,
      systemPrompt: buildSystemPrompt(),
      userMessage: buildUserMessage({ code, errorMessage }),
    })

    lastParsed = parseDebugText(rawText)

    if (
      looksLikeValidCode(lastParsed.code) &&
      (await isValidPythonSyntax(lastParsed.code))
    ) {
      return {
        title: lastParsed.title || "Virheen korjausehdotus",
        diagnosis: lastParsed.diagnosis,
        code: lastParsed.code,
      }
    }
  }

  throw new Error(
    "AI ei pystynyt tuottamaan kelvollista korjausehdotusta " +
      `${MAX_ATTEMPTS} yrityksellä. Kokeile uudelleen.`,
  )
}
