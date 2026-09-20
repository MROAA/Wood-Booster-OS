import { isValidPythonSyntax } from "./pythonSyntaxValidator.js"

import { chatWithOllama } from "./ollamaClient.js"

/*
 * Käyttää samaa koodiin erikoistunutta mallia kuin
 * pythonCodeGenerator.js - refaktorointi on koodin ymmärtämistä ja
 * uudelleenkirjoittamista, ei sujuvaa suomenkielistä proosaa, joten
 * FINNISH_CONTENT_MODEL (Poro-2) ei sovi tähän samalla tavalla kuin
 * pythonCodeExplainer.js/pythonCodeReviewer.js:ään.
 */
const DEFAULT_MODEL =
  process.env.PYTHON_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Refaktoroi annettu Python-koodi - paranna " +
    "luettavuutta, selkeyttä ja rakennetta MUUTTAMATTA koodin " +
    "toiminnallisuutta. Älä lisää uusia ominaisuuksia. Jos koodi on " +
    "jo hyvässä kunnossa, tee vain pieniä siistimisiä. " +
    "Vastaa TARKALLEEN tässä muodossa:\n" +
    "OTSIKKO: <lyhyt kuvaava otsikko>\n" +
    "SELITYS: <lyhyt suomenkielinen kuvaus tehdyistä muutoksista>\n" +
    "KOODI:\n" +
    "```python\n" +
    "# TIEDOSTO ALKAA TÄSTÄ\n" +
    "<koko refaktoroitu tiedosto>\n" +
    "```\n" +
    "TÄRKEÄÄ: rivi \"# TIEDOSTO ALKAA TÄSTÄ\" on vain merkki koodin " +
    "alusta, ei osa tiedostoa - kirjoita sen JÄLKEEN tiedoston oma " +
    "sisältö kokonaisuudessaan alusta asti, myös jos tiedosto alkaa " +
    "kolmoislainausmerkillä (\"\"\") - älä koskaan jätä sitä pois vain " +
    "koska se muistuttaa koodilohkon omaa ```-rajaa."
  )
}

export function parseRefactoredText(text) {
  // Pysähdytään ennemmin koodilohkon alkuun (```) kuin
  // kirjaimelliseen "KOODI:"-tekstiin - katso perustelu
  // pythonCodeDebugger.js:n parseDebugText()-funktiosta.
  const titleMatch = text.match(
    /OTSIKKO:\s*([\s\S]*?)(?:\nSELITYS:|\n```|\nKOODI:|$)/i,
  )

  const explanationMatch = text.match(
    /SELITYS:\s*([\s\S]*?)(?:\n```|\nKOODI:|$)/i,
  )

  const codeBlockMatch = text.match(
    /```(?:python)?\s*\n([\s\S]*?)```/i,
  )

  const fallbackCodeMatch = text.match(/KOODI:\s*([\s\S]*)$/i)

  const rawCode = codeBlockMatch
    ? codeBlockMatch[1].trim()
    : (fallbackCodeMatch ? fallbackCodeMatch[1].trim() : text.trim())

  // Katso perustelu pythonCodeDebugger.js:n parseDebugText()-funktiosta.
  const code = rawCode.replace(/^#\s*TIEDOSTO ALKAA TÄSTÄ\s*\n/i, "")

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    explanation: explanationMatch ? explanationMatch[1].trim() : "",
    code,
  }
}

/*
 * Suojaus samaa vikaa vastaan kuin pythonCodeDebugger.js:ssä -
 * malli voi joskus palauttaa kirjaimellisesti kehotteen oman
 * placeholder-tekstin koodina takaisin oikean koodin sijaan.
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

const MAX_ATTEMPTS = 2

/*
 * Refaktoroi annetun Python-koodin. Ei koskaan kirjoita mihinkään
 * itse - palauttaa vain ehdotetun koodin ja selityksen, jonka
 * kutsuja tallentaa PythonCodeDraft-luonnokseksi ihmisen
 * hyväksyttäväksi (sama draft/approve/write-malli kuin
 * write-python-skillillä).
 */
export async function refactorPythonCode({
  code,
  model = DEFAULT_MODEL,
}) {
  let parsed = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const rawText = await chatWithOllama({
      model,
      systemPrompt: buildSystemPrompt(),
      userMessage: code,
    })

    parsed = parseRefactoredText(rawText)

    if (
      looksLikeValidCode(parsed.code) &&
      (await isValidPythonSyntax(parsed.code))
    ) {
      break
    }

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(
        "AI ei pystynyt tuottamaan kelvollista refaktorointia " +
          `${MAX_ATTEMPTS} yrityksellä. Kokeile uudelleen.`,
      )
    }
  }

  return {
    title: parsed.title || "Refaktoroitu koodi",
    explanation: parsed.explanation,
    code: parsed.code,
    model,
  }
}
