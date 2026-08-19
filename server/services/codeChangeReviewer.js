import { chatWithOllama } from "./ollamaClient.js"

const DEFAULT_MODEL =
  process.env.CODE_OLLAMA_MODEL ||
  process.env.OLLAMA_MODEL ||
  "qwen2.5-coder:7b"

function buildSystemPrompt() {
  return (
    "TEHTÄVÄ: Arvioi annettu koodi ja anna rakentava katselmointi " +
    "selkeällä suomen kielellä. Kerro mikä koodissa on hyvää, ja " +
    "nosta esiin 2-4 konkreettista parannusehdotusta (esim. " +
    "mahdolliset virheet, epäselvät kohdat, turvallisuus, " +
    "luettavuus). Älä toista koodia takaisin, älä kirjoita uutta " +
    "koodia - vain sanallinen arvio. Jos et löydä mitään " +
    "huomautettavaa, sano niin suoraan äläkä keksi ongelmia."
  )
}

/*
 * Antaa katselmoinnin annetulle koodille (minkä tahansa tuetun
 * tiedostotyypin) luonnollisella kielellä. Ei koskaan kirjoita tai
 * suorita mitään - pelkkä sanallinen arvio, ei koodimuutoksia.
 *
 * Sama eri-oletusmalli-perustelu kuin codeChangeExplainer.js:ssä.
 */
export async function reviewCodeChange({
  code,
  model = DEFAULT_MODEL,
}) {
  if (!code || !code.trim()) {
    return {
      review: "Tiedosto on tyhjä, ei mitään arvioitavaa.",
    }
  }

  const review = await chatWithOllama({
    model,
    systemPrompt: buildSystemPrompt(),
    userMessage: code,
  })

  return {
    review,
  }
}
