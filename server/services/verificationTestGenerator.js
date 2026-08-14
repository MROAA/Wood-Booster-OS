/*
 * Wood-Booster HQ
 * Boosterverse
 *
 * Verification Test Generator
 *
 * Sama Ollama-kutsu/jäsennys/uudelleenyritys-rakenne kuin
 * codeChangeGenerator.js:ssä (jonka OTSIKKO:/SELITYS:/KOODI:
 * -jäsennintä, parseCodeChangeText, käytetään sellaisenaan tässäkin -
 * muoto on jo riittävän yleinen testikoodillekin, ei tarvetta
 * kahdelle identtiselle jäsentimelle).
 *
 * Pyytää AI:ta kirjoittamaan pienen, kohdennetun node:test-testin
 * juuri pyydetylle muutokselle - ei kattavaa testisarjaa, vain yksi
 * tarkistus sille mitä käyttäjä nimenomaan pyysi. Testi tuodaan aina
 * kiinteästä "./target.mjs"-polusta, koska generateVerificationTestSkill
 * kirjoittaa ehdotetun sisällön juuri sillä nimellä samaan
 * hiekkalaatikkohakemistoon (ks. verificationSandbox.js) - AI:n ei
 * tarvitse arvata todellista tiedostonimeä tai -polkua.
 */

import { parseCodeChangeText } from "./codeChangeGenerator.js"

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const DEFAULT_MODEL =
  process.env.CODE_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5:7b"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Kirjoita YKSI pieni, kohdennettu Node.js-testi " +
    "Node.js:n sisäänrakennetulla node:test/node:assert/strict " +
    "-kirjastolla (ei muita testikirjastoja) sille MUUTOKSELLE joka " +
    "juuri tehtiin - älä yritä testata koko tiedostoa kattavasti, " +
    "testaa vain sitä käyttäytymistä jota alkuperäinen pyyntö nimenomaan " +
    "koski. Testattava koodi on tuotavissa kiinteästä polusta " +
    "\"./target.mjs\" - käytä ES module -importteja " +
    "(import { ... } from \"./target.mjs\"), älä require:a. Jos " +
    "koodi ei vie mitään nimettyä exportia joka olisi järkevä " +
    "testata suoraan (esim. se on pelkkä React-komponentti), kirjoita " +
    "silti järkevin mahdollinen testi (esim. tarkista että moduuli " +
    "latautuu virheettä). " +
    "Vastaa TARKALLEEN tässä muodossa:\n" +
    "OTSIKKO: <lyhyt kuvaava otsikko testille>\n" +
    "SELITYS: <yksi lause: mitä testi tarkistaa>\n" +
    "KOODI:\n" +
    "```\n" +
    "# TIEDOSTO ALKAA TÄSTÄ\n" +
    "<koko testitiedoston sisältö kokonaisuudessaan>\n" +
    "```"
  )
}

function looksLikeValidTest(code) {
  const trimmed = (code || "").trim()

  if (trimmed.length < 10) {
    return false
  }

  if (!/\btest\s*\(/.test(trimmed) && !/from\s+["']node:test["']/.test(trimmed)) {
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
 * Kirjoittaa pienen node:test-testin annetulle ehdotetulle
 * muutokselle. Ei koskaan aja mitään itse - vain palauttaa
 * testikoodin, jonka runVerificationTestSkill.js ajaa hiekkalaatikossa.
 */
export async function generateVerificationTest({
  prompt,
  proposedCode,
  filePath,
  model = DEFAULT_MODEL,
}) {
  const userMessage =
    `TIEDOSTO: ${filePath}\n\n` +
    `ALKUPERÄINEN PYYNTÖ:\n${prompt}\n\n` +
    `TIEDOSTON UUSI SISÄLTÖ (./target.mjs):\n${proposedCode}`

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
