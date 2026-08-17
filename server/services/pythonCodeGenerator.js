import { chatWithOllama } from "./ollamaClient.js"

const DEFAULT_MODEL =
  process.env.PYTHON_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b"

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
  const rawText = await chatWithOllama({
    model,
    systemPrompt: buildSystemPrompt(),
    userMessage: prompt,
  })

  const parsed = parseGeneratedText(rawText)

  return {
    title: parsed.title || "Python-skripti",
    code: parsed.code,
    model,
  }
}
