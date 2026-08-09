const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const DEFAULT_MODEL =
  process.env.FINNISH_CONTENT_MODEL ||
  process.env.OLLAMA_MODEL ||
  "kahnwong/poro-2:8b-it"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Selitä annettu Python-koodi selkeällä, ei-teknisellä " +
    "suomen kielellä henkilölle joka ei ole ohjelmoija. Kerro mitä " +
    "koodi tekee ja miksi, älä käy läpi riviä riveltä syntaksia. " +
    "Älä toista koodia takaisin. Pidä vastaus lyhyenä (muutama " +
    "kappale, ei luettelo jokaisesta funktiosta jos koodi on pitkä " +
    "- keskity kokonaiskuvaan)."
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
 * Selittää annetun Python-koodin luonnollisella kielellä. Kutsuu
 * Ollamaa suoraan, samaan tapaan kuin generatePythonDraft() -
 * ei tallenna mitään, palauttaa vain selityksen kutsujalle.
 */
export async function explainPythonCode({
  code,
  model = DEFAULT_MODEL,
}) {
  if (!code || !code.trim()) {
    return {
      explanation: "Tiedosto on tyhjä, ei mitään selitettävää.",
    }
  }

  const explanation = await askOllama({
    model,
    code,
  })

  return {
    explanation,
  }
}
