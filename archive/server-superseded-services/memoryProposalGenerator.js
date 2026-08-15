import {
  extractMemory,
} from "./memoryExtractor.js"

import {
  validateMemory,
} from "./memoryValidator.js"

import {
  createMemoryProposal,
} from "./memoryProposalService.js"


/*
==================================================

WOOD-BOOSTER MEMORY PROPOSAL GENERATOR

Vastuut:

1. Muotoilee keskustelun Memory Extractorille.
2. Pyytää Extractoria tunnistamaan muistettavan tiedon.
3. Tarkistaa ehdotuksen Memory Validatorilla.
4. Tallentaa hyväksytyn ehdotuksen MemoryProposal-tauluun.
5. Epäonnistuu turvallisesti katkaisematta AI-keskustelua.

Tämä palvelu EI:

- hyväksy muistiehdotusta pysyvään muistiin
- kirjoita suoraan Memory-tauluun
- muuta AI Brainin reititystä
- käsittele HTTP-pyyntöjä
- estä keskustelua virheen sattuessa

==================================================
*/


function normalizeConversationMessage(
  conversationMessage,
) {
  if (!conversationMessage) {
    return null
  }

  if (
    typeof conversationMessage ===
    "string"
  ) {
    const content =
      conversationMessage.trim()

    if (!content) {
      return null
    }

    return {
      role:
        "user",

      content,
    }
  }

  const role =
    String(
      conversationMessage.role ||
      "user",
    )
      .trim()
      .toLowerCase()

  const content =
    String(
      conversationMessage.content ||
      conversationMessage.message ||
      "",
    ).trim()

  if (!content) {
    return null
  }

  return {
    role,
    content,
  }
}


function normalizeConversation(
  conversation,
) {
  if (!conversation) {
    return []
  }

  const messages =
    Array.isArray(conversation)
      ? conversation
      : [
          conversation,
        ]

  return messages
    .map(
      normalizeConversationMessage,
    )
    .filter(Boolean)
}


function createConversationText({
  conversation,
  message,
  answer,
}) {
  const normalizedConversation =
    normalizeConversation(
      conversation,
    )

  const currentMessage =
    String(
      message ||
      "",
    ).trim()

  const currentAnswer =
    String(
      answer ||
      "",
    ).trim()

  const messages = [
    ...normalizedConversation,
  ]

  if (currentMessage) {
    messages.push({
      role:
        "user",

      content:
        currentMessage,
    })
  }

  if (currentAnswer) {
    messages.push({
      role:
        "assistant",

      content:
        currentAnswer,
    })
  }

  return messages
    .map(
      (conversationMessage) => {
        const roleLabel =
          conversationMessage.role ===
          "assistant"
            ? "ASSISTANT"
            : "USER"

        return [
          `${roleLabel}:`,
          conversationMessage.content,
        ].join(" ")
      },
    )
    .join("\n\n")
    .trim()
}


function createGeneratorResult({
  success,
  created,
  status,
  reason,
  extractedMemory = null,
  validation = null,
  proposal = null,
  error = null,
}) {
  return {
    success,
    created,
    status,
    reason,
    extractedMemory,
    validation,
    proposal,
    error,
  }
}


async function generateMemoryProposal({
  conversation = [],
  message = "",
  answer = "",
  prismaClient,
  model = "qwen2.5:7b",
} = {}) {
  try {
    const conversationText =
      createConversationText({
        conversation,
        message,
        answer,
      })

    if (!conversationText) {
      return createGeneratorResult({
        success:
          true,

        created:
          false,

        status:
          "skipped",

        reason:
          "Keskustelussa ei ollut analysoitavaa sisältöä.",
      })
    }

    const extractedMemory =
      await extractMemory({
        conversation:
          conversationText,

        model,
      })

    if (
      !extractedMemory ||
      extractedMemory.shouldSave !==
        true
    ) {
      return createGeneratorResult({
        success:
          true,

        created:
          false,

        status:
          "not_needed",

        reason:
          "Keskustelusta ei löytynyt pysyvään muistiin ehdotettavaa tietoa.",

        extractedMemory:
          extractedMemory ||
          null,
      })
    }

    const validation =
      validateMemory(
        extractedMemory,
      )

    if (!validation.valid) {
      return createGeneratorResult({
        success:
          true,

        created:
          false,

        status:
          "rejected",

        reason:
          "Memory Validator hylkäsi muistiehdotuksen.",

        extractedMemory,
        validation,
      })
    }

    const proposal =
      await createMemoryProposal({
        prismaClient,
        memory:
          extractedMemory,
      })

    if (!proposal) {
      return createGeneratorResult({
        success:
          false,

        created:
          false,

        status:
          "storage_failed",

        reason:
          "Muistiehdotusta ei voitu tallentaa.",

        extractedMemory,
        validation,
      })
    }

    return createGeneratorResult({
      success:
        true,

      created:
        true,

      status:
        "pending_approval",

      reason:
        "Muistiehdotus luotiin ja odottaa käyttäjän hyväksyntää.",

      extractedMemory,
      validation,
      proposal,
    })
  }
  catch (error) {
    console.error(
      "MEMORY PROPOSAL GENERATOR ERROR:",
      error,
    )

    return createGeneratorResult({
      success:
        false,

      created:
        false,

      status:
        "generator_failed",

      reason:
        "Muistiehdotuksen luominen epäonnistui turvallisesti.",

      error:
        error?.message ||
        String(error),
    })
  }
}


export {
  createConversationText,
  generateMemoryProposal,
  normalizeConversation,
}
