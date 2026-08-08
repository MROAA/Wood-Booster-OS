const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

const DEFAULT_MODEL =
  process.env.PYTHON_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5:7b"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Kirjoita yksi siisti, toimiva Python-tiedosto annetun " +
    "pyynnön perusteella Wood-Boosterin kehityskäyttöön. Käytä " +
    "selkeitä muuttujanimiä ja lisää lyhyt docstring tiedoston " +
    "alkuun. Älä selitä koodia erikseen, älä lisää ylimääräistä " +
    "tekstiä koodilohkon ulkopuolelle. " +
    "Vastaa TARKALLEEN tässä muodossa:\n" +
    "OTSIKKO: <lyhyt kuvaava otsikko>\n" +
    "KOODI:\n" +
    "```python\n" +
    "<koodi>\n" +
    "```"
  )
}

export function parseGeneratedText(text) {
  const titleMatch = text.match(
    /OTSIKKO:\s*([\s\S]*?)(?:\nKOODI:|$)/i,
  )

  const codeBlockMatch = text.match(
    /```(?:python)?\s*\n([\s\S]*?)```/i,
  )

  const fallbackCodeMatch = text.match(/KOODI:\s*([\s\S]*)$/i)

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    code: codeBlockMatch
      ? codeBlockMatch[1].trim()
      : (fallbackCodeMatch ? fallbackCodeMatch[1].trim() : text.trim()),
  }
}

async function askOllama({ model, prompt }) {
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
          content: prompt,
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
 * Kirjoittaa Python-koodiluonnoksen annetun pyynnön pohjalta. Kutsuu
 * Ollamaa suoraan, samaan tapaan kuin blogContentGenerator.js:n
 * generateBlogDraft(), mutta ilman Ahma-viimeistelyä (se on
 * suomenkielisen proosan kielenhuoltoon, ei koodille).
 */
export async function generatePythonDraft({
  prompt,
  model = DEFAULT_MODEL,
}) {
  const rawText = await askOllama({
    model,
    prompt,
  })

  const parsed = parseGeneratedText(rawText)

  return {
    title: parsed.title || "Python-skripti",
    code: parsed.code,
  }
}
