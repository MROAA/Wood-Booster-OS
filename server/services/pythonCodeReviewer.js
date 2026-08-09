const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const DEFAULT_MODEL =
  process.env.FINNISH_CONTENT_MODEL ||
  process.env.OLLAMA_MODEL ||
  "kahnwong/poro-2:8b-it"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Arvioi annettu Python-koodi ja anna rakentava " +
    "katselmointi selkeällä suomen kielellä. Kerro mikä koodissa on " +
    "hyvää, ja nosta esiin 2-4 konkreettista parannusehdotusta " +
    "(esim. mahdolliset virheet, epäselvät kohdat, turvallisuus, " +
    "luettavuus). Älä toista koodia takaisin, älä kirjoita uutta " +
    "koodia - vain sanallinen arvio. Jos et löydä mitään " +
    "huomautettavaa, sano niin suoraan äläkä keksi ongelmia."
  )
}

async function askOllama({ model, code }) {
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
          content: code,
        },
      ],
      options: {
        temperature: 0.2,
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
 * Antaa katselmoinnin annetulle Python-koodille luonnollisella
 * kielellä. Ei koskaan kirjoita tai suorita mitään - pelkkä
 * sanallinen arvio, ei koodimuutoksia.
 */
export async function reviewPythonCode({
  code,
  model = DEFAULT_MODEL,
}) {
  if (!code || !code.trim()) {
    return {
      review: "Tiedosto on tyhjä, ei mitään arvioitavaa.",
    }
  }

  const review = await askOllama({
    model,
    code,
  })

  return {
    review,
  }
}
