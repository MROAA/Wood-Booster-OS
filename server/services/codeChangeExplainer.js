import { chatWithOllama } from "./ollamaClient.js"

const DEFAULT_MODEL =
  process.env.CODE_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Selitä annettu koodi selkeällä, ei-teknisellä suomen " +
    "kielellä henkilölle joka ei ole ohjelmoija. Kerro mitä koodi " +
    "tekee ja miksi, älä käy läpi riviä riveltä syntaksia. Älä " +
    "toista koodia takaisin. Pidä vastaus lyhyenä (muutama kappale, " +
    "ei luettelo jokaisesta funktiosta jos koodi on pitkä - keskity " +
    "kokonaiskuvaan)."
  )
}

/*
 * Selittää annetun koodin (minkä tahansa tuetun tiedostotyypin, ei
 * vain Python) luonnollisella kielellä. Kutsuu Ollamaa suoraan, ei
 * tallenna mitään, palauttaa vain selityksen kutsujalle.
 *
 * Eri oletusmalli kuin pythonCodeExplainer.js:llä - tämä näkee
 * mielivaltaisia projektitiedostoja (.jsx/.ts/.css/jne.), ei vain
 * .py-koodia, joten sama koodikykyinen malli kuin
 * codeChangeGenerator.js käyttää on turvallisempi valinta syötteen
 * ymmärtämiseen, vaikka vastausteksti pysyy silti suomeksi.
 */
export async function explainCodeChange({
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
