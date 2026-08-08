import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { refineWithAhma } from "./ahmaClient.js"

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const DEFAULT_MODEL =
  process.env.OLLAMA_MODEL ||
  "qwen2.5:7b"

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)

const toneOfVoicePath = path.resolve(
  currentDirectory,
  "../ai-knowledge/brand/Tone of voice.txt",
)

let cachedToneOfVoice = null

function loadToneOfVoice() {
  if (cachedToneOfVoice === null) {
    cachedToneOfVoice = fs.readFileSync(toneOfVoicePath, "utf-8")
  }

  return cachedToneOfVoice
}

function buildSystemPrompt() {
  return (
    loadToneOfVoice() +
    "\n\n---\n\n" +
    "TEHTÄVÄ: Kirjoita Instagram-julkaisuteksti valmistuneesta " +
    "puutyöprojektista yllä olevan äänensävyn mukaisesti. " +
    "Vastaa TARKALLEEN tässä muodossa, kahdella rivillä:\n" +
    "KUVATEKSTI: <kuvateksti, 2-4 lausetta>\n" +
    "HASHTAGIT: <8-12 hashtagia välilyönnillä eroteltuna, " +
    "esim. #puuseppä #käsityö>\n" +
    "Älä käytä ylisanoja (\"vallankumouksellinen\", " +
    "\"ainutlaatuinen\", \"täydellinen\"). " +
    "Älä keksi tietoja joita ei ole annettu."
  )
}

function buildUserMessage(project) {
  const lines = []

  lines.push(`Projekti: ${project.name}`)

  if (project.description) {
    lines.push(`Kuvaus: ${project.description}`)
  }

  if (project.notes) {
    lines.push(`Muistiinpanot: ${project.notes}`)
  }

  if (project.materials?.length) {
    lines.push(
      `Materiaalit: ${project.materials.map(item => item.name).join(", ")}`,
    )
  }

  if (project.customer?.name) {
    lines.push(
      `Asiakas: ${project.customer.company || project.customer.name}`,
    )
  }

  return lines.join("\n")
}

function parseGeneratedText(text) {
  const captionMatch = text.match(
    /KUVATEKSTI:\s*([\s\S]*?)(?:\nHASHTAGIT:|$)/i,
  )

  const hashtagsMatch = text.match(/HASHTAGIT:\s*([\s\S]*)$/i)

  return {
    caption: captionMatch ? captionMatch[1].trim() : text.trim(),
    hashtags: hashtagsMatch ? hashtagsMatch[1].trim() : "",
  }
}

async function askOllama({ model, message }) {
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
          content: message,
        },
      ],
      options: {
        temperature: 0.4,
        num_ctx: 4096,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Ollama error")
  }

  return String(data.message?.content || "").trim()
}

/*
 * Kirjoittaa Instagram-julkaisuluonnoksen projektin oikean datan ja
 * Wood-Boosterin brändiäänen pohjalta. Kutsuu Ollamaa suoraan (ei
 * koko aiBrain-chat-putkea, koska tämä on rajattu, kiinteämuotoinen
 * tehtävä eikä avoin keskustelu). Kuvateksti viimeistellään Ahmalla
 * samaan tapaan kuin aiBrain.js:ssä, hashtagit jätetään koskematta.
 */
export async function generateSocialDraft({
  project,
  model = DEFAULT_MODEL,
}) {
  const rawText = await askOllama({
    model,
    message: buildUserMessage(project),
  })

  const parsed = parseGeneratedText(rawText)

  const ahmaResult = await refineWithAhma({
    text: parsed.caption,
  })

  return {
    caption: ahmaResult.text || parsed.caption,
    hashtags: parsed.hashtags,
  }
}
