const MAX_PROJECT_NOTES_LENGTH = 4000

const MAX_MEMORY_ITEMS = 5
const MAX_MEMORY_LENGTH = 700

const MAX_KNOWLEDGE_ITEMS = 5
const MAX_KNOWLEDGE_LENGTH = 1200

const MAX_CONVERSATION_ITEMS = 6
const MAX_CONVERSATION_MESSAGE_LENGTH = 700

const MAX_QUESTION_LENGTH = 2000

const MAX_TOTAL_CONTEXT_LENGTH = 14000


function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ""
  }

  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}


function truncateText(
  value,
  maximumLength,
) {
  const text =
    cleanText(value)

  if (!text) {
    return ""
  }

  if (
    text.length <= maximumLength
  ) {
    return text
  }

  return `${text
    .slice(0, maximumLength)
    .trim()}

[TEKSTIÄ LYHENNETTY]`
}


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : []
}


function getMemoryContent(item) {
  if (!item) {
    return ""
  }

  return (
    item.content ||
    item.text ||
    item.value ||
    item.memory ||
    item.title ||
    ""
  )
}


function getKnowledgeTitle(
  item,
  index,
) {
  return (
    cleanText(
      item?.name ||
      item?.title,
    ) ||
    `Tietolähde ${index + 1}`
  )
}


function getKnowledgeContent(item) {
  if (!item) {
    return ""
  }

  return (
    item.content ||
    item.text ||
    item.description ||
    item.value ||
    ""
  )
}


function getConversationRole(item) {
  const role =
    cleanText(item?.role)
      .toLowerCase()

  if (role === "user") {
    return "USER"
  }

  if (role === "assistant") {
    return "ASSISTANT"
  }

  if (role === "system") {
    return "SYSTEM"
  }

  return "UNKNOWN"
}


function buildMemorySection(memory) {
  const memoryItems =
    safeArray(memory)
      /*
       * Käytetään viimeisimpiä muistimerkintöjä.
       */
      .slice(-MAX_MEMORY_ITEMS)

  if (
    memoryItems.length === 0
  ) {
    return "Ei käytettävissä olevaa muistia."
  }

  return memoryItems
    .map((item, index) => {
      const category =
        cleanText(item?.category) ||
        "general"

      const key =
        cleanText(item?.key)

      const content =
        truncateText(
          getMemoryContent(item),
          MAX_MEMORY_LENGTH,
        )

      return `
MEMORY ITEM ${index + 1}

Category:
${category}

Key:
${key || "Ei avainta"}

Content:
${content || "Tyhjä muistimerkintä"}
`.trim()
    })
    .join(
      "\n\n--------------------\n\n",
    )
}


function buildKnowledgeSection(
  knowledge,
) {
  const knowledgeItems =
    safeArray(knowledge)
      /*
       * AGENT_CONTEXT käsitellään backendissä,
       * joten sitä ei tarvitse lähettää
       * frontendistä uudelleen.
       */
      .filter((item) => {
        return (
          item?.name !==
          "AGENT_CONTEXT"
        )
      })
      .slice(
        0,
        MAX_KNOWLEDGE_ITEMS,
      )

  if (
    knowledgeItems.length === 0
  ) {
    return "Ei käytettävissä olevaa tietopankkisisältöä."
  }

  return knowledgeItems
    .map((item, index) => {
      const title =
        getKnowledgeTitle(
          item,
          index,
        )

      const topic =
        cleanText(
          item?.topic ||
          item?.category,
        )

      const content =
        truncateText(
          getKnowledgeContent(item),
          MAX_KNOWLEDGE_LENGTH,
        )

      return `
KNOWLEDGE ITEM ${index + 1}

Source:
${title}

Topic:
${topic || "Ei aihetta"}

Content:
${content || "Ei sisältöä"}
`.trim()
    })
    .join(
      "\n\n--------------------\n\n",
    )
}


function buildConversationSection({
  conversation,
  question,
}) {
  const cleanQuestion =
    cleanText(question)

  const conversationItems =
    safeArray(conversation)
      .filter((item) => {
        const content =
          cleanText(item?.content)

        if (!content) {
          return false
        }

        /*
         * ProjectAIChat lisää nykyisen kysymyksen
         * conversation-listaan. Se poistetaan tästä,
         * koska sama kysymys lisätään erikseen
         * CURRENT USER QUESTION -osioon.
         */
        const isCurrentQuestion =
          item?.role === "user" &&
          content === cleanQuestion

        return !isCurrentQuestion
      })
      .slice(
        -MAX_CONVERSATION_ITEMS,
      )

  if (
    conversationItems.length === 0
  ) {
    return "Ei aikaisempaa keskustelua."
  }

  return conversationItems
    .map((item, index) => {
      const role =
        getConversationRole(item)

      const content =
        truncateText(
          item?.content,
          MAX_CONVERSATION_MESSAGE_LENGTH,
        )

      return `
MESSAGE ${index + 1}

Role:
${role}

Content:
${content}
`.trim()
    })
    .join(
      "\n\n--------------------\n\n",
    )
}


export function buildProjectContext({
  project = {},
  memory = [],
  knowledge = [],
  conversation = [],
  question = "",
}) {
  const cleanQuestion =
    truncateText(
      question,
      MAX_QUESTION_LENGTH,
    )

  const memorySection =
    buildMemorySection(memory)

  const knowledgeSection =
    buildKnowledgeSection(
      knowledge,
    )

  const conversationSection =
    buildConversationSection({
      conversation,
      question,
    })

  const context = `
WOOD-BOOSTER PROJECT CONTEXT

====================
PROJECT
====================

Project ID:
${project?.id ?? "Ei tietoa"}

Name:
${cleanText(project?.name) || "Ei nimeä"}

Status:
${cleanText(project?.status) || "Ei tilaa"}

Customer:
${
  cleanText(
    project?.customer?.name,
  ) ||
  "Ei asiakasta"
}

Notes:
${
  truncateText(
    project?.notes,
    MAX_PROJECT_NOTES_LENGTH,
  ) ||
  "Ei muistiinpanoja"
}

====================
MEMORY
====================

${memorySection}

====================
KNOWLEDGE
====================

${knowledgeSection}

====================
CONVERSATION HISTORY
====================

${conversationSection}

====================
CURRENT USER QUESTION
====================

${cleanQuestion || "Ei kysymystä"}

====================
RESPONSE RULES
====================

- Vastaa suomeksi.
- Vastaa ensin käyttäjän kysymykseen.
- Käytä ensisijaisesti projektin tietoja.
- Käytä muistia vain käyttäjän työskentelyn ymmärtämiseen.
- Käytä tietopankkia Wood-Boosterin yritystietona.
- Noudata Truth Authority- ja Truth Layer -tietoa.
- Älä keksi puuttuvia mittoja, materiaaleja, hintoja, aikatauluja tai päätöksiä.
- Älä esitä yleistä tietoa tämän projektin faktana.
- Kerro suoraan, jos tarvittavaa tietoa puuttuu.
- Erottele vahvistettu tieto ja ehdotus.
- Anna käytännöllinen ja selkeä vastaus.
`.trim()


  if (
    context.length <=
    MAX_TOTAL_CONTEXT_LENGTH
  ) {
    console.log(
      "PROJECT CONTEXT PARTS:",
      {
        projectNotes:
          cleanText(
            project?.notes,
          ).length,

        memoryItems:
          safeArray(memory).length,

        knowledgeItems:
          safeArray(knowledge).length,

        conversationItems:
          safeArray(
            conversation,
          ).length,

        question:
          cleanQuestion.length,

        total:
          context.length,
      },
    )

    console.log(
      "PROJECT CONTEXT SIZE:",
      context.length,
      "characters",
    )

    return context
  }


  const shortenedContext =
    `${context
      .slice(
        0,
        MAX_TOTAL_CONTEXT_LENGTH,
      )
      .trim()}

[PROJECT CONTEXT TRUNCATED]`


  console.warn(
    "PROJECT CONTEXT TRUNCATED:",
    context.length,
    "→",
    shortenedContext.length,
    "characters",
  )


  return shortenedContext
}
