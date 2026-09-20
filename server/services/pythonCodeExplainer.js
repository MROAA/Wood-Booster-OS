import { chatWithOllama } from "./ollamaClient.js"

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

  const explanation = await chatWithOllama({
    model,
    systemPrompt: buildSystemPrompt(),
    userMessage: code,
  })

  return {
    explanation,
  }
}
