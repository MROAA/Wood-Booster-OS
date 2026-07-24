import {
  filterSystemFiles,
} from "./systemFilter.js"

import {
  voiceProfile,
} from "./voiceProfile.js"


/*
======================================
CONTEXT LIMITS
======================================
*/

const MAX_TOTAL_CONTEXT_LENGTH = 28000

const MAX_SYSTEM_FILES = 8
const MAX_SYSTEM_FILE_LENGTH = 2800
const MAX_SYSTEM_CONTEXT_LENGTH = 14000

const MAX_AGENT_ITEMS = 3
const MAX_AGENT_ITEM_LENGTH = 2500
const MAX_AGENT_CONTEXT_LENGTH = 6000

const MAX_KNOWLEDGE_ITEMS = 8
const MAX_KNOWLEDGE_ITEM_LENGTH = 1600
const MAX_KNOWLEDGE_CONTEXT_LENGTH = 9000

const MAX_MEMORY_ITEMS = 8
const MAX_MEMORY_ITEM_LENGTH = 900
const MAX_MEMORY_CONTEXT_LENGTH = 5000

const MAX_CONVERSATION_ITEMS = 8
const MAX_CONVERSATION_ITEM_LENGTH = 1000
const MAX_CONVERSATION_CONTEXT_LENGTH = 6000

const MAX_MESSAGE_LENGTH = 5000


/*
======================================
TEXT HELPERS
======================================
*/

function cleanText(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return ""
  }

  return String(value)
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
}


function truncateText(
  value,
  maximumLength,
) {
  const text = cleanText(value)

  if (!text) {
    return ""
  }

  if (
    text.length <= maximumLength
  ) {
    return text
  }

  return `${text.slice(
    0,
    maximumLength,
  ).trim()}

[CONTENT TRUNCATED]`
}


function truncateSection(
  value,
  maximumLength,
  sectionName,
) {
  const text = cleanText(value)

  if (
    text.length <= maximumLength
  ) {
    return text
  }

  return `${text.slice(
    0,
    maximumLength,
  ).trim()}

[${sectionName} TRUNCATED]`
}


function safeArray(value) {
  return Array.isArray(value)
    ? value
    : []
}


/**
 * Wood-Booster AI Brain
 *
 * Context Builder
 *
 * Rakentaa AI:n työmuistin.
 *
 * Prioriteetti:
 *
 * 1. System Identity
 * 2. Voice Profile
 * 3. Agent Instructions
 * 4. Knowledge Database
 * 5. Memory
 * 6. Conversation
 * 7. User message
 */
export async function buildAIContext({
  message,
  knowledge = [],
  memory = [],
  conversation = [],
}) {
  const safeKnowledge =
    safeArray(knowledge)

  const safeMemory =
    safeArray(memory)

  const safeConversation =
    safeArray(conversation)

  const cleanMessage =
    truncateText(
      message,
      MAX_MESSAGE_LENGTH,
    )


  /*
  ======================================
  SYSTEM FILES
  ======================================
  */

  const systemFilesResult =
    await filterSystemFiles(
      cleanMessage,
    )

  const systemFiles =
    safeArray(systemFilesResult)
      .slice(
        0,
        MAX_SYSTEM_FILES,
      )

  const systemContextRaw =
    systemFiles
      .map((file) => {
        const fileName =
          cleanText(file?.name) ||
          "UNKNOWN_SYSTEM_FILE"

        const fileContent =
          truncateText(
            file?.content,
            MAX_SYSTEM_FILE_LENGTH,
          )

        return `
==================================================
SYSTEM FILE
==================================================

${fileName}

${fileContent || "Ei sisältöä."}
`.trim()
      })
      .join("\n\n")

  const systemContext =
    truncateSection(
      systemContextRaw ||
        "Ei valittuja system-tiedostoja.",
      MAX_SYSTEM_CONTEXT_LENGTH,
      "SYSTEM CONTEXT",
    )


  /*
  ======================================
  VOICE PROFILE
  ======================================
  */

  const speakingStyle =
    safeArray(
      voiceProfile?.speakingStyle,
    )
      .map(cleanText)
      .filter(Boolean)
      .join(", ")

  const writingRules =
    safeArray(
      voiceProfile?.writingRules,
    )
      .map((rule) => {
        return `- ${cleanText(rule)}`
      })
      .filter(
        (rule) => rule !== "- ",
      )
      .join("\n")

  const avoidStyle =
    safeArray(
      voiceProfile?.avoidStyle,
    )
      .map((item) => {
        return `- ${cleanText(item)}`
      })
      .filter(
        (item) => item !== "- ",
      )
      .join("\n")

  const avoidWords =
    safeArray(
      voiceProfile?.avoidWords,
    )
      .map((word) => {
        return `- ${cleanText(word)}`
      })
      .filter(
        (word) => word !== "- ",
      )
      .join("\n")

  const officialValues =
    safeArray(
      voiceProfile?.officialValues,
    )
      .map((value) => {
        return `- ${cleanText(value)}`
      })
      .filter(
        (value) => value !== "- ",
      )
      .join("\n")

  const aiShould =
    safeArray(
      voiceProfile?.aiRole?.should,
    )
      .map((item) => {
        return `- ${cleanText(item)}`
      })
      .filter(
        (item) => item !== "- ",
      )
      .join("\n")

  const aiShouldNot =
    safeArray(
      voiceProfile?.aiRole?.shouldNot,
    )
      .map((item) => {
        return `- ${cleanText(item)}`
      })
      .filter(
        (item) => item !== "- ",
      )
      .join("\n")

  const voiceContext = `
==================================================
WOOD-BOOSTER VOICE PROFILE
==================================================

Puhetapa:

${speakingStyle || "Selkeä ja suora."}

Persoona:

${
  cleanText(
    voiceProfile?.personality
      ?.description,
  ) || "Wood-Booster AI"
}

Asenne:

${
  cleanText(
    voiceProfile?.personality
      ?.attitude,
  ) || "Ratkaisukeskeinen"
}

Suhde käyttäjään:

${
  cleanText(
    voiceProfile?.personality
      ?.relationship,
  ) || "Avustava"
}

Kirjoitussäännöt:

${writingRules || "- Vastaa selkeästi."}

Vältettävä tyyli:

${avoidStyle || "- Turha täyte."}

Vältettävät sanat:

${avoidWords || "- Ei määritelty."}

Viralliset arvot:

${officialValues || "- Ei määritelty."}

AI:n rooli:

${
  cleanText(
    voiceProfile?.aiRole
      ?.description,
  ) || "Wood-Booster-avustaja"
}

AI:n tulee:

${aiShould || "- Auttaa käyttäjää."}

AI ei saa:

${aiShouldNot || "- Kek­siä faktoja."}
`.trim()


  /*
  ======================================
  AGENT INSTRUCTIONS
  ======================================
  */

  const agentItems =
    safeKnowledge
      .filter((item) => {
        return (
          item?.name ===
          "AGENT_CONTEXT"
        )
      })
      .slice(
        0,
        MAX_AGENT_ITEMS,
      )

  const agentContextRaw =
    agentItems
      .map((item, index) => {
        return `
AGENT INSTRUCTION ${index + 1}

${truncateText(
  item?.content,
  MAX_AGENT_ITEM_LENGTH,
)}
`.trim()
      })
      .join("\n\n")

  const agentContext =
    truncateSection(
      agentContextRaw ||
        "Ei erillisiä agenttiohjeita.",
      MAX_AGENT_CONTEXT_LENGTH,
      "AGENT CONTEXT",
    )


  /*
  ======================================
  KNOWLEDGE DATABASE
  ======================================
  */

  /*
   * AGENT_CONTEXT jätetään tästä pois,
   * koska se lisättiin jo agentContext-osioon.
   * Tämä poistaa saman tiedon kahteen kertaan.
   */

  const knowledgeItems =
    safeKnowledge
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

  const knowledgeContextRaw =
    knowledgeItems
      .map((item, index) => {
        const sourceName =
          cleanText(
            item?.name ||
            item?.title,
          ) ||
          `knowledge-${index + 1}`

        const content =
          truncateText(
            item?.content,
            MAX_KNOWLEDGE_ITEM_LENGTH,
          )

        return `
==================================================
KNOWLEDGE ${index + 1}
==================================================

Lähde:

${sourceName}

Sisältö:

${content || "Ei sisältöä."}
`.trim()
      })
      .join("\n\n")

  const knowledgeContext =
    truncateSection(
      knowledgeContextRaw ||
        "Ei lisätietoa tietopankista.",
      MAX_KNOWLEDGE_CONTEXT_LENGTH,
      "KNOWLEDGE CONTEXT",
    )


  /*
  ======================================
  MEMORY
  ======================================
  */

  const memoryItems =
    safeMemory
      .slice(
        -MAX_MEMORY_ITEMS,
      )

  const memoryContextRaw =
    memoryItems
      .map((item, index) => {
        const category =
          cleanText(item?.category) ||
          "general"

        const key =
          cleanText(item?.key)

        const content =
          truncateText(
            item?.content,
            MAX_MEMORY_ITEM_LENGTH,
          )

        return `
==================================================
MEMORY ${index + 1}
==================================================

Category:
${category}

Key:
${key || "Ei avainta"}

Content:
${content || "Ei sisältöä."}
`.trim()
      })
      .join("\n\n")

  const memoryContext =
    truncateSection(
      memoryContextRaw ||
        "Ei tallennettua muistia.",
      MAX_MEMORY_CONTEXT_LENGTH,
      "MEMORY CONTEXT",
    )


  /*
  ======================================
  CONVERSATION
  ======================================
  */

  const conversationItems =
    safeConversation
      .slice(
        -MAX_CONVERSATION_ITEMS,
      )

  const conversationContextRaw =
    conversationItems
      .map((item, index) => {
        const role =
          cleanText(item?.role) ||
          "unknown"

        const content =
          truncateText(
            item?.content,
            MAX_CONVERSATION_ITEM_LENGTH,
          )

        return `
MESSAGE ${index + 1}

Role:
${role}

Content:
${content || "Ei sisältöä."}
`.trim()
      })
      .join("\n\n")

  const conversationContext =
    truncateSection(
      conversationContextRaw ||
        "Ei aikaisempaa keskustelua.",
      MAX_CONVERSATION_CONTEXT_LENGTH,
      "CONVERSATION CONTEXT",
    )


  /*
  ======================================
  FINAL AI CONTEXT
  ======================================
  */

  const fullContextRaw = `
==================================================
WOOD-BOOSTER AI BRAIN
==================================================

Olet Wood-Booster AI Brain.

Sinun tehtäväsi:

Auttaa ihmistä ajattelemaan,
suunnittelemaan ja ratkaisemaan ongelmia.

Älä keksi tietoa.

Jos tietoa ei löydy:

"Minulla ei ole tästä vielä tallennettua tietoa."

==================================================
SYSTEM IDENTITY
==================================================

${systemContext}

${voiceContext}

==================================================
AGENT INSTRUCTIONS
==================================================

TÄRKEÄÄ:
Tämä agentti ohittaa yleisen tietosi.

Jos tietoa ei löydy agentin lähteistä:
- älä arvaa
- älä täydennä yleisellä tiedolla
- kerro että tieto puuttuu

${agentContext}

==================================================
KNOWLEDGE DATABASE
==================================================

Käytä tätä yritystietona.

Tietopankki on ensisijainen lähde
liiketoimintaa koskevissa kysymyksissä.

${knowledgeContext}

==================================================
MEMORY
==================================================

Käytä muistia käyttäjän työskentelyn ymmärtämiseen.

${memoryContext}

==================================================
CONVERSATION HISTORY
==================================================

${conversationContext}

==================================================
CURRENT USER MESSAGE
==================================================

${cleanMessage || "Ei viestiä."}

==================================================
FINAL RULES
==================================================

- Vastaa ensin kysymykseen.
- Älä täytä vastausta turhilla johdannoilla.
- Käytä yksinkertaista kieltä.
- Erottele fakta ja ehdotus.
- Jos et tiedä, sano ettet tiedä.
- Älä keksi Wood-Boosterille uusia arvoja.
- Älä keksi tuotteita ilman tietopankkia.
- Älä keksi materiaaleja, puulajeja, työkaluja tai työmenetelmiä ilman lähdettä.
- Älä esitä yleistä ammattitietoa Wood-Boosterin faktana.
- Jos projektikohtainen tieto puuttuu, kerro että tieto puuttuu.
- Agentin omat rajoitukset ovat tärkeämpiä kuin yleinen tietosi.
- Erottele aina fakta ja ehdotus.

==================================================
END CONTEXT
==================================================
`.trim()

  const fullContext =
    truncateSection(
      fullContextRaw,
      MAX_TOTAL_CONTEXT_LENGTH,
      "FULL AI CONTEXT",
    )


  /*
  ======================================
  DEBUG
  ======================================
  */

  console.log(
    "CONTEXT PARTS:",
    {
      systemFiles:
        systemFiles.length,

      system:
        systemContext.length,

      voice:
        voiceContext.length,

      agent:
        agentContext.length,

      knowledgeItems:
        knowledgeItems.length,

      knowledge:
        knowledgeContext.length,

      memoryItems:
        memoryItems.length,

      memory:
        memoryContext.length,

      conversationItems:
        conversationItems.length,

      conversation:
        conversationContext.length,

      message:
        cleanMessage.length,

      total:
        fullContext.length,
    },
  )

  console.log(
    "CONTEXT CREATED:",
    fullContext.length,
    "characters",
  )

  return fullContext
}
