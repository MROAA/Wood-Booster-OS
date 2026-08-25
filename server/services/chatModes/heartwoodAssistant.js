/*
 * /heartwood chat-tila: Heartwood Project Assistant - AI-projektipäällikkö
 * Marcin Heartwood-pelille. Marc ei ole ohjelmoija eikä tunne pelikehitystä,
 * joten tämä persoona on tietoisesti eri kuin yleinen Spacemonkey-agentti
 * (server/services/agentExecutor.js) - ei navigointikomentoja, ei
 * action plannereita, pelkkä keskittynyt roolikeskustelu, samaan tapaan
 * kuin /koodi ohittaa yleisen agent-reitityksen (ks. agentChat.js
 * runCodeChangePlanTurn).
 *
 * Tämä EI kutsu jaettua runAIBrain()-putkea (server/services/aiBrain.js).
 * Kokeilin sitä ensin, mutta se ruiskuttaa jokaiseen vastaukseen
 * ~30k merkkiä Wood-Boosterin puusepänliike-identiteettiä (Spacemonkey-
 * persoona, "Truth"-kerros, workshop-rajoitukset) buildAIContext()/
 * truthBundle-kerroksista - täysin väärä konteksti pelisuunnittelu-
 * keskusteluun, ja pienellä paikallismallilla (qwen2.5:7b) se hukutti
 * oman system promptini kokonaan (testattu: vastaus puhui puutuotteista
 * Heartwoodin sijaan). Heartwood on oma projektinsa saman katon alla,
 * ei osa Wood-Boosterin liiketoimintaa, joten se saa oman, puhtaan
 * Ollama-kutsun jaetun business-kontekstin sijaan.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b"
const SYSTEM_PROMPT = `
Olet Heartwood Project Assistant - Heartwood-pelin AI-projektipäällikkö,
pelisuunnittelija ja opettaja.

Käyttäjä (Marc) ei ole ohjelmoija eikä tunne pelikehityksen prosesseja.
Älä koskaan oleta aiempaa tietämystä. Kun käytät termiä jota käyttäjä
ei välttämättä tunne (esim. "event bus", "status effect", "vertical
slice"), selitä se lyhyesti yhdellä lauseella ennen kuin jatkat.

Roolisi:
- Project Manager: pidä roadmap ja prioriteetit järjestyksessä.
- Game Designer: auta suunnittelemaan mekaniikkoja, luokkia, synergioita.
- Technical Planner: muuta idea konkreettisiksi tehtäviksi (title,
  description, priority, complexity, dependencies, acceptance criteria).
- Teacher: selitä käsitteet ilman oletuksia.
- Scope Guardian: jos käyttäjä ehdottaa jotain isoa (esim. "100 sankaria",
  "moninpeli"), älä vain hyväksy - kysy tarvitaanko se juuri nyt vai
  myöhemmin, ja ehdota pienempää ensimmäistä askelta (vertical slice).

Kun käyttäjä ehdottaa uutta ominaisuutta, käy läpi tämä ketju
keskustelussa: IDEA -> DESIGN (mitä pelaaja näkee/kokee) -> FEATURE ->
mitkä järjestelmät tarvitaan -> konkreettiset tehtävät. Älä hyppää
suoraan tehtäviin kysymättä ensin mitä pelaaja näkee ja miksi tämä on
hauskaa.

Jos käyttäjä kysyy "mitä teen seuraavaksi", perusta vastauksesi alla
annettuun HEARTWOOD_PROJECT_STATE-tietoon (avoimet tehtävät ja
päätökset), älä keksi tilannetta.

Vastaa aina suomeksi, selkeästi ja lyhyin kappalein. Älä käytä
ohjelmointitermejä ilman selitystä.
`.trim()

function summarizeTasks(tasks) {
  if (!tasks.length) {
    return "Ei vielä yhtään tehtävää roadmapilla."
  }

  return tasks
    .slice(0, 30)
    .map(
      (task) =>
        `- [#${task.id}] (${task.status}, prio ${task.priority}, ${task.complexity}) ` +
        `${task.title} - vaihe: ${task.phase}` +
        (task.dependencies ? ` | riippuu: ${task.dependencies}` : ""),
    )
    .join("\n")
}

function summarizeDecisions(decisions) {
  if (!decisions.length) {
    return "Ei vielä yhtään kirjattua päätöstä."
  }

  return decisions
    .slice(0, 15)
    .map(
      (decision) =>
        `- [DEC-${String(decision.id).padStart(3, "0")}] ${decision.title}: ` +
        `${decision.decision}` +
        (decision.reason ? ` (syy: ${decision.reason})` : ""),
    )
    .join("\n")
}

async function askOllama({ context, conversation, message }) {
  const messages = [
    { role: "system", content: context },
    ...conversation
      .filter((turn) => turn?.role && turn?.content)
      .slice(-12)
      .map((turn) => ({ role: turn.role, content: String(turn.content) })),
    { role: "user", content: message },
  ]

  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      stream: false,
      messages,
      options: { temperature: 0.3, num_ctx: 8192 },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || "Ollama error")
  }

  return String(data.message?.content || "").trim()
}

export async function runHeartwoodTurn({ text, conversation, prisma }) {
  if (!text) {
    return {
      status: 200,
      body: {
        success: true,
        answer:
          "Kerro vapaasti mitä haluaisit Heartwoodiin, tai kysy " +
          '"mitä teen seuraavaksi?" niin katson roadmapin tilanteen.',
      },
    }
  }

  let tasks = []
  let decisions = []
  let knowledgeDocs = []

  if (prisma) {
    ;[tasks, decisions, knowledgeDocs] = await Promise.all([
      prisma.heartwoodTask.findMany({
        orderBy: [{ phase: "asc" }, { createdAt: "asc" }],
      }),
      prisma.heartwoodDecision.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.knowledgeDocument.findMany({
        where: { topic: "heartwood" },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { title: true, content: true, folder: true },
      }),
    ])
  }

  const knowledgeText = knowledgeDocs.length
    ? knowledgeDocs
        .map((doc) => `## ${doc.title}\n${doc.content}`)
        .join("\n\n")
    : "Ei vielä tallennettuja tietopankkidokumentteja."

  const context = `${SYSTEM_PROMPT}

==================================================
HEARTWOOD_PROJECT_STATE
==================================================

AVOIMET TEHTÄVÄT / ROADMAP:
${summarizeTasks(tasks)}

PÄÄTÖSLOKI (viimeisimmät):
${summarizeDecisions(decisions)}

==================================================
HEARTWOOD_KNOWLEDGE_BASE
==================================================

${knowledgeText}
`

  try {
    const answer = await askOllama({
      context,
      conversation: Array.isArray(conversation) ? conversation : [],
      message: text,
    })

    return {
      status: 200,
      body: {
        success: true,
        agent: "heartwood-assistant",
        reason: "heartwood project assistant mode",
        answer,
        action: null,
        actions: [],
      },
    }
  } catch (error) {
    console.error("HEARTWOOD ASSISTANT ERROR:", error)

    return {
      status: 500,
      body: {
        success: false,
        answer: `Heartwood Assistant -virhe: ${error.message}`,
      },
    }
  }
}
