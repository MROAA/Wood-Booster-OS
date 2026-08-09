import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { refineWithAhma } from "./ahmaClient.js"

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const DEFAULT_MODEL =
  process.env.FINNISH_CONTENT_MODEL ||
  process.env.OLLAMA_MODEL ||
  "kahnwong/poro-2:8b-it"

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

export const PLATFORMS = ["instagram", "facebook", "linkedin"]

const DEFAULT_PLATFORM = "instagram"

const PLATFORM_SPECS = {
  instagram: {
    label: "Instagram",
    instructions:
      "Kirjoita Instagram-julkaisuteksti valmistuneesta " +
      "puutyöprojektista. Kuvateksti 2-4 lausetta, rento mutta " +
      "asiantunteva sävy. 8-12 hashtagia.",
  },

  facebook: {
    label: "Facebook",
    instructions:
      "Kirjoita Facebook-julkaisuteksti valmistuneesta " +
      "puutyöprojektista. Kuvateksti saa olla pidempi ja " +
      "jutusteleva (4-6 lausetta) kuin Instagramissa - Facebookin " +
      "yleisö lukee mielellään taustatarinaa. Korkeintaan 3 " +
      "hashtagia, koska ne eivät ole Facebookissa yhtä oleellisia.",
  },

  linkedin: {
    label: "LinkedIn",
    instructions:
      "Kirjoita LinkedIn-julkaisuteksti valmistuneesta " +
      "puutyöprojektista. Sävy ammattimaisempi ja liiketoiminta- " +
      "painotteinen kuin Instagramissa/Facebookissa - painota " +
      "käsityötaitoa, laatua ja asiakastyötä, ei some-fiilistä. " +
      "3-5 lausetta, 3-5 asiallista hashtagia " +
      "(esim. #puuseppä #käsityöyrittäjä #suomalainenkäsityö).",
  },
}

function buildSystemPrompt(platform) {
  const spec = PLATFORM_SPECS[platform] || PLATFORM_SPECS[DEFAULT_PLATFORM]

  return (
    loadToneOfVoice() +
    "\n\n---\n\n" +
    `TEHTÄVÄ: ${spec.instructions} ` +
    "Vastaa TARKALLEEN tässä muodossa, kahdella rivillä:\n" +
    "KUVATEKSTI: <kuvateksti>\n" +
    "HASHTAGIT: <hashtagit välilyönnillä eroteltuna, tai tyhjä " +
    "jos niitä ei pyydetty>\n" +
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

async function askOllama({ model, message, platform }) {
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
          content: buildSystemPrompt(platform),
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
  platform = DEFAULT_PLATFORM,
  model = DEFAULT_MODEL,
}) {
  const rawText = await askOllama({
    model,
    platform,
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
