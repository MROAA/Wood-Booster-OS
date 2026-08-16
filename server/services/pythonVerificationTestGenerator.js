/*
 * Wood-Booster HQ
 * Boosterverse
 *
 * Python Verification Test Generator
 *
 * Sama Ollama-kutsu/jäsennys/uudelleenyritys-rakenne kuin
 * verificationTestGenerator.js:ssä (JS-puolen vastine) - sen
 * OTSIKKO:/SELITYS:/KOODI: -jäsennintä, parseCodeChangeText, käytetään
 * sellaisenaan tässäkin, muoto on jo riittävän yleinen Python-
 * testikoodillekin.
 *
 * Pyytää AI:ta kirjoittamaan pienen, kohdennetun unittest-testin (ei
 * pytestiä - sitä ei ole asennettu, ja stdlib-vaihtoehto ei vaadi
 * mitään uutta riippuvuutta) juuri pyydetylle muutokselle. Testi
 * tuodaan aina kiinteästä "target"-moduulinimestä, koska
 * generatePythonTestSkill.js kirjoittaa ehdotetun sisällön juuri sillä
 * nimellä (target.py) samaan hiekkalaatikkohakemistoon. Testitiedosto
 * ajetaan suoraan skriptinä (python3 <polku>), ei unittest-
 * moduulihakuna - siksi sen TÄYTYY päättyä
 * "if __name__ == '__main__': unittest.main()" -lohkoon.
 */

import { parseCodeChangeText } from "./codeChangeGenerator.js"

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const DEFAULT_MODEL =
  process.env.PYTHON_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5:7b"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Kirjoita YKSI pieni, kohdennettu Python-testi Pythonin " +
    "sisäänrakennetulla unittest-kirjastolla (ÄLÄ käytä pytestiä, sitä " +
    "ei ole asennettu) sille MUUTOKSELLE joka juuri tehtiin - älä " +
    "yritä testata koko tiedostoa kattavasti, testaa vain sitä " +
    "käyttäytymistä jota alkuperäinen pyyntö nimenomaan koski. " +
    "Testattava koodi on tuotavissa kiinteästä moduulista \"target\" " +
    "(esim. \"from target import laske_summa\"). Testiluokan TÄYTYY " +
    "periytyä unittest.TestCase:sta, ja tiedoston TÄYTYY päättyä " +
    "TÄSMÄLLEEN tähän lohkoon:\n" +
    "if __name__ == \"__main__\":\n" +
    "    unittest.main()\n" +
    "Jos koodissa ei ole yhtään järkevästi suoraan testattavaa " +
    "funktiota tai luokkaa (esim. se on pelkkä skripti), kirjoita " +
    "silti järkevin mahdollinen testi (esim. tarkista että moduuli " +
    "tuo onnistuu virheettä). " +
    "Vastaa TARKALLEEN tässä muodossa:\n" +
    "OTSIKKO: <lyhyt kuvaava otsikko testille>\n" +
    "SELITYS: <yksi lause: mitä testi tarkistaa>\n" +
    "KOODI:\n" +
    "```python\n" +
    "<koko testitiedoston sisältö kokonaisuudessaan>\n" +
    "```"
  )
}

function looksLikeValidTest(code) {
  const trimmed = (code || "").trim()

  if (trimmed.length < 10) {
    return false
  }

  if (!/unittest\.main\s*\(\s*\)/.test(trimmed)) {
    return false
  }

  if (!/class\s+\w+\s*\(\s*unittest\.TestCase\s*\)/.test(trimmed)) {
    return false
  }

  return true
}

async function askOllama({ model, userMessage }) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      options: {
        temperature: 0.2,
        num_ctx: 8192,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Ollama error")
  }

  return String(data.message?.content || "").trim()
}

const MAX_ATTEMPTS = 2

/*
 * Kirjoittaa pienen unittest-testin annetulle ehdotetulle Python-
 * muutokselle. Ei koskaan aja mitään itse - vain palauttaa
 * testikoodin, jonka runPythonTestSkill.js ajaa hiekkalaatikossa.
 */
export async function generatePythonVerificationTest({
  prompt,
  proposedCode,
  filePath,
  model = DEFAULT_MODEL,
}) {
  const userMessage =
    `TIEDOSTO: ${filePath}\n\n` +
    `ALKUPERÄINEN PYYNTÖ:\n${prompt}\n\n` +
    `TIEDOSTON UUSI SISÄLTÖ (target-moduulina):\n${proposedCode}`

  let parsed = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const rawText = await askOllama({
      model,
      userMessage,
    })

    parsed = parseCodeChangeText(rawText)

    if (looksLikeValidTest(parsed.code)) {
      break
    }

    if (attempt === MAX_ATTEMPTS) {
      throw new Error(
        "AI ei pystynyt tuottamaan kelvollista testiä " +
          `${MAX_ATTEMPTS} yrityksellä.`,
      )
    }
  }

  return {
    title: parsed.title || "Tarkistustesti",
    explanation: parsed.explanation,
    code: parsed.code,
  }
}
