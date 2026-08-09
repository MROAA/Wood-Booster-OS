const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"

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
  "qwen2.5:7b"

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
    "<koko refaktoroitu tiedosto>\n" +
    "```"
  )
}

export function parseRefactoredText(text) {
  const titleMatch = text.match(
    /OTSIKKO:\s*([\s\S]*?)(?:\nSELITYS:|\nKOODI:|$)/i,
  )

  const explanationMatch = text.match(
    /SELITYS:\s*([\s\S]*?)(?:\nKOODI:|$)/i,
  )

  const codeBlockMatch = text.match(
    /```(?:python)?\s*\n([\s\S]*?)```/i,
  )

  const fallbackCodeMatch = text.match(/KOODI:\s*([\s\S]*)$/i)

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    explanation: explanationMatch ? explanationMatch[1].trim() : "",
    code: codeBlockMatch
      ? codeBlockMatch[1].trim()
      : (fallbackCodeMatch ? fallbackCodeMatch[1].trim() : text.trim()),
  }
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
  const rawText = await askOllama({
    model,
    code,
  })

  const parsed = parseRefactoredText(rawText)

  return {
    title: parsed.title || "Refaktoroitu koodi",
    explanation: parsed.explanation,
    code: parsed.code,
  }
}
