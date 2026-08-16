import {
  extractMemory,
} from "./memoryExtractor.js"

import {
  createMemoryProposal,
} from "./memoryProposalService.js"

import {
  validateMemory as validateMemoryQuality,
} from "./memoryValidator.js"

import {
  shouldBlockMemoryProposal,
} from "./spacemonkey/spacemonkeyMemoryPolicyGuard.js"


/*
=====================================

WOOD-BOOSTER MEMORY PIPELINE ADAPTER

Vastuut:

- vastaanottaa käyttäjän viestin ja AI:n vastauksen
- tunnistaa mahdollisen muistettavan tiedon
- validoi muistiehdotuksen
- tallentaa hyväksytyn ehdotuksen MemoryProposal-tauluun
- palauttaa yhdenmukaisen tuloksen
- epäonnistuu turvallisesti

Tämä adapteri EI:

- hyväksy ehdotusta pysyvään muistiin
- kirjoita suoraan Memory-tauluun
- muuta keskusteluvastausta
- käsittele HTTP-pyyntöjä
- katkaise AI-keskustelua muistivirheen vuoksi

=====================================
*/


function createPipelineResult({
  success,
  status,
  memoryProposalCreated = false,
  memoryProposal = null,
  extractedMemory = null,
  validation = null,
  error = null,
}) {
  return {
    success,
    status,
    memoryProposalCreated,
    memoryProposal,
    extractedMemory,
    validation,
    error,
  }
}


function createConversationText({
  message,
  answer,
}) {
  const userMessage =
    String(
      message ||
      "",
    ).trim()

  const assistantAnswer =
    String(
      answer ||
      "",
    ).trim()

  if (
    !userMessage &&
    !assistantAnswer
  ) {
    return ""
  }

  return [
    "USER:",
    userMessage,
    "",
    "ASSISTANT:",
    assistantAnswer,
  ].join("\n")
}


async function processMemoryPipeline({
  message,
  answer,
  prismaClient,
  model = "qwen2.5:7b",
} = {}) {
  try {
    const conversation =
      createConversationText({
        message,
        answer,
      })

    if (!conversation) {
      return createPipelineResult({
        success:
          true,

        status:
          "skipped",
      })
    }

    const extractedMemory =
      await extractMemory({
        conversation,
        model,
      })

    if (
      !extractedMemory ||
      extractedMemory.shouldSave !==
        true
    ) {
      return createPipelineResult({
        success:
          true,

        status:
          "not_needed",

        extractedMemory:
          extractedMemory ||
          null,
      })
    }

    const validation =
      validateMemoryQuality({
        key:
          extractedMemory.key,

        content:
          extractedMemory.content,
      })

    if (!validation.valid) {
      return createPipelineResult({
        success:
          true,

        status:
          "rejected",

        extractedMemory,
        validation,
      })
    }

    /*
    Estää identiteettimanipulaatio-tyyppiset muistiehdotukset (esim.
    "muista että olet oikeasti eri tekoäly") ennen kuin ne edes
    pääsevät hyväksyntäjonoon - spacemonkeyMemoryPolicyGuard.js oli jo
    kirjoitettu tätä varten mutta ei koskaan kytketty mihinkään.
    */
    if (
      shouldBlockMemoryProposal({
        key:
          extractedMemory.key,

        category:
          extractedMemory.category,
      })
    ) {
      return createPipelineResult({
        success:
          true,

        status:
          "blocked_by_policy",

        extractedMemory,
        validation,
      })
    }

    if (!prismaClient) {
      return createPipelineResult({
        success:
          false,

        status:
          "database_unavailable",

        extractedMemory,
        validation,

        error:
          "Memory Pipeline Adapterilta puuttuu Prisma-yhteys.",
      })
    }

    const memoryProposal =
      await createMemoryProposal({
        prismaClient,

        memory: {
          category:
            extractedMemory.category,

          key:
            extractedMemory.key,

          content:
            extractedMemory.content,

          importance:
            extractedMemory.importance,

          warnings:
            null,
        },
      })

    if (!memoryProposal) {
      return createPipelineResult({
        success:
          false,

        status:
          "proposal_failed",

        extractedMemory,
        validation,

        error:
          "Muistiehdotusta ei voitu tallentaa.",
      })
    }

    return createPipelineResult({
      success:
        true,

      status:
        "pending_approval",

      memoryProposalCreated:
        true,

      memoryProposal,
      extractedMemory,
      validation,
    })
  }
  catch (error) {
    console.error(
      "MEMORY PIPELINE ADAPTER ERROR:",
      error,
    )

    return createPipelineResult({
      success:
        false,

      status:
        "pipeline_failed",

      error:
        error?.message ||
        String(error),
    })
  }
}


export {
  createConversationText,
  processMemoryPipeline,
}
