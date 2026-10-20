/**
 * Wood-Booster / Hearthwood
 * Ollama Client
 *
 * Yhteinen asiakas paikalliselle Ollama-palvelimelle.
 *
 * Ominaisuudet:
 * - yhteysosoite ympäristömuuttujasta
 * - aikakatkaisu
 * - selkeät virheilmoitukset
 * - generate- ja chat-rajapinnat
 *
 * Ei muuta AI Brainin toimintalogiikkaa.
 */

const OLLAMA_BASE_URL = (
  process.env.OLLAMA_URL ||
  "http://127.0.0.1:11434"
).replace(/\/+$/, "")

const DEFAULT_TIMEOUT_MS = 60000

function getTimeoutMs() {
  const configured = Number(
    process.env.OLLAMA_TIMEOUT_MS,
  )

  if (
    Number.isFinite(configured) &&
    configured > 0
  ) {
    return configured
  }

  return DEFAULT_TIMEOUT_MS
}

async function requestOllama(endpoint, payload) {
  const timeoutMs = getTimeoutMs()

  let response
  let data

  try {
    response = await fetch(
      `${OLLAMA_BASE_URL}${endpoint}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),

        signal: AbortSignal.timeout(timeoutMs),
      },
    )

    data = await response.json()
  } catch (error) {
    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      throw new Error(
        `Ollama ei vastannut ${Math.round(
          timeoutMs / 1000,
        )} sekunnissa.`,
      )
    }

    if (error instanceof SyntaxError) {
      throw new Error(
        "Ollama palautti virheellisen JSON-vastauksen.",
      )
    }

    throw new Error(
      `Ollama-yhteys epäonnistui (${OLLAMA_BASE_URL}): ${
        error?.message || "tuntematon virhe"
      }`,
    )
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `Ollama palautti HTTP-virheen ${response.status}.`,
    )
  }

  return data
}

/**
 * Perinteinen tekstigenerointi.
 *
 * Säilyttää aiemman paluuarvorakenteen.
 */

export async function generateWithOllama({
  prompt,
  model = "qwen2.5:7b",
}) {
  try {
    console.log(
      "[Ollama] Generating:",
      model,
    )

    const data = await requestOllama(
      "/api/generate",
      {
        model,
        prompt,
        stream: false,
      },
    )

    return {
      success: true,
      response: String(data.response || ""),
    }
  } catch (error) {
    console.error(
      "[Ollama] Generate failed:",
      error.message,
    )

    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Keskustelurajapinta.
 *
 * Hearthwood Code Analyst käyttää tätä.
 *
 * Virheet välitetään kutsujalle selkeinä
 * virheilmoituksina.
 */

export async function chatWithOllama({
  model,
  systemPrompt,
  userMessage,
  numCtx = 4096,
}) {
  console.log(
    "[Ollama] Chat started:",
    model,
  )

  try {
    const data = await requestOllama(
      "/api/chat",
      {
        model,

        stream: false,

        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],

        options: {
          temperature: 0.2,
          num_ctx: numCtx,
        },
      },
    )

    const answer = String(
      data.message?.content || "",
    ).trim()

    if (!answer) {
      throw new Error(
        "Ollama palautti tyhjän vastauksen.",
      )
    }

    console.log(
      "[Ollama] Chat completed:",
      model,
    )

    return answer
  } catch (error) {
    console.error(
      "[Ollama] Chat failed:",
      model,
      error.message,
    )

    throw error
  }
}
