/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY MODULE

Vastuut:
- tunnistaa muistien hallintapyynnöt
- näyttää hyväksytyt muistot
- näyttää odottavat muistiehdotukset
- hyväksyy muistiehdotuksen
- hylkää muistiehdotuksen
- käyttää nykyisiä muistipalveluita

Tämä tiedosto ei:
- muuta nykyistä AI Brainia
- tallenna keskustelua automaattisesti
- kirjoita suoraan pysyvään muistiin
  ilman hyväksyttyä muistiehdotusta
- kutsu kielimallia
- käsittele HTTP-pyyntöjä
=====================================
*/


import {
  getMemory,
} from "../../memoryService.js"

import {
  approveMemoryProposal,
  getPendingProposals,
  rejectMemoryProposal,
} from "../../memoryProposalService.js"

import {
  createBrainModule,
} from "../moduleContract.js"


const MEMORY_ACTIONS = {
  LIST_MEMORIES:
    "list_memories",

  LIST_PROPOSALS:
    "list_proposals",

  APPROVE_PROPOSAL:
    "approve_proposal",

  REJECT_PROPOSAL:
    "reject_proposal",
}


const LIST_MEMORY_PHRASES = [
  "näytä muistot",
  "listaa muistot",
  "mitä muistat",
  "näytä ai muisti",
  "näytä tekoälyn muisti",
  "hae muistot",
]


const LIST_PROPOSAL_PHRASES = [
  "näytä muistiehdotukset",
  "listaa muistiehdotukset",
  "näytä odottavat muistot",
  "näytä odottavat muistiehdotukset",
  "hae muistiehdotukset",
]


const APPROVE_PHRASES = [
  "hyväksy muistiehdotus",
  "hyväksy muistiehdotus numero",
  "hyväksy muisti",
]


const REJECT_PHRASES = [
  "hylkää muistiehdotus",
  "hylkää muistiehdotus numero",
  "hylkää muisti",
]


function normalizeMessage(
  message,
) {
  return String(
    message ||
    "",
  )
    .trim()
    .toLowerCase()
}


function containsPhrase(
  message,
  phrases,
) {
  return phrases.some(
    (phrase) =>
      message.includes(
        phrase,
      ),
  )
}


function extractProposalId(
  message,
) {
  const match =
    String(
      message ||
      "",
    ).match(
      /\b(\d+)\b/,
    )

  if (!match) {
    return null
  }

  const id =
    Number.parseInt(
      match[1],
      10,
    )

  if (
    !Number.isInteger(id) ||
    id < 1
  ) {
    return null
  }

  return id
}


function analyzeMemoryRequest(
  message,
) {
  const normalizedMessage =
    normalizeMessage(
      message,
    )

  if (!normalizedMessage) {
    return {
      matched:
        false,

      confidence:
        0,

      reason:
        "Viesti on tyhjä.",

      action:
        null,

      proposalId:
        null,
    }
  }

  if (
    containsPhrase(
      normalizedMessage,
      APPROVE_PHRASES,
    )
  ) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää muistiehdotuksen hyväksymiskomennon.",

      action:
        MEMORY_ACTIONS
          .APPROVE_PROPOSAL,

      proposalId:
        extractProposalId(
          normalizedMessage,
        ),
    }
  }

  if (
    containsPhrase(
      normalizedMessage,
      REJECT_PHRASES,
    )
  ) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää muistiehdotuksen hylkäyskomennon.",

      action:
        MEMORY_ACTIONS
          .REJECT_PROPOSAL,

      proposalId:
        extractProposalId(
          normalizedMessage,
        ),
    }
  }

  if (
    containsPhrase(
      normalizedMessage,
      LIST_PROPOSAL_PHRASES,
    )
  ) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää muistiehdotusten listauspyynnön.",

      action:
        MEMORY_ACTIONS
          .LIST_PROPOSALS,

      proposalId:
        null,
    }
  }

  if (
    containsPhrase(
      normalizedMessage,
      LIST_MEMORY_PHRASES,
    )
  ) {
    return {
      matched:
        true,

      confidence:
        1,

      reason:
        "Viesti sisältää hyväksyttyjen muistojen listauspyynnön.",

      action:
        MEMORY_ACTIONS
          .LIST_MEMORIES,

      proposalId:
        null,
    }
  }

  return {
    matched:
      false,

    confidence:
      0,

    reason:
      "Viesti ei sisällä tunnistettua muistien hallintapyyntöä.",

    action:
      null,

    proposalId:
      null,
  }
}


function createMemoryListAnswer(
  memories,
) {
  if (
    !Array.isArray(memories) ||
    memories.length === 0
  ) {
    return "Pysyvässä muistissa ei ole vielä tallennettuja tietoja."
  }

  const lines =
    memories.map(
      (memory) =>
        [
          `#${memory.id}`,
          `[${memory.category}]`,
          memory.key,
          `– ${memory.content}`,
        ].join(" "),
    )

  return [
    `Pysyvästä muistista löytyi ${memories.length} tietoa:`,
    "",
    ...lines,
  ].join("\n")
}


function createProposalListAnswer(
  proposals,
) {
  if (
    !Array.isArray(proposals) ||
    proposals.length === 0
  ) {
    return "Odottavia muistiehdotuksia ei ole."
  }

  const lines =
    proposals.map(
      (proposal) =>
        [
          `#${proposal.id}`,
          `[${proposal.category}]`,
          proposal.key,
          `– ${proposal.content}`,
          `(tärkeys ${proposal.importance})`,
        ].join(" "),
    )

  return [
    `Odottavia muistiehdotuksia löytyi ${proposals.length}:`,
    "",
    ...lines,
  ].join("\n")
}


function requirePrisma(
  runtimeContext,
) {
  const prisma =
    runtimeContext?.prisma

  if (!prisma) {
    throw new Error(
      "Memory Module tarvitsee Prisma-yhteyden.",
    )
  }

  return prisma
}


function createMemoryModule() {
  return createBrainModule({
    id:
      "memory",

    name:
      "Memory Module",

    version:
      "1.0.0",

    description:
      "Hallitsee hyväksyttyjä muistoja ja odottavia muistiehdotuksia.",

    priority:
      150,

    canHandle({
      request,
    }) {
      const analysis =
        analyzeMemoryRequest(
          request?.message,
        )

      return {
        matched:
          analysis.matched,

        confidence:
          analysis.confidence,

        reason:
          analysis.reason,

        metadata:
          analysis.matched
            ? {
                action:
                  analysis.action,

                proposalId:
                  analysis.proposalId,
              }
            : null,
      }
    },

    async execute({
      message,
      request,
      runtimeContext,
    }) {
      const analysis =
        analyzeMemoryRequest(
          message,
        )

      if (!analysis.matched) {
        throw new Error(
          "Memory Module ei tunnistanut muistipyyntöä.",
        )
      }

      const prisma =
        requirePrisma(
          runtimeContext,
        )

      if (
        analysis.action ===
        MEMORY_ACTIONS.LIST_MEMORIES
      ) {
        const memories =
          await getMemory({
            prisma,
            limit:
              20,
          })

        return {
          type:
            "memory_result",

          mode:
            MEMORY_ACTIONS
              .LIST_MEMORIES,

          answer:
            createMemoryListAnswer(
              memories,
            ),

          memories,

          proposals:
            [],

          affectedMemory:
            null,

          proposalId:
            null,

          requestId:
            request.requestId,

          source:
            runtimeContext.source,
        }
      }

      if (
        analysis.action ===
        MEMORY_ACTIONS.LIST_PROPOSALS
      ) {
        const proposals =
          await getPendingProposals({
            prismaClient:
              prisma,
          })

        return {
          type:
            "memory_result",

          mode:
            MEMORY_ACTIONS
              .LIST_PROPOSALS,

          answer:
            createProposalListAnswer(
              proposals,
            ),

          memories:
            [],

          proposals,

          affectedMemory:
            null,

          proposalId:
            null,

          requestId:
            request.requestId,

          source:
            runtimeContext.source,
        }
      }

      if (!analysis.proposalId) {
        return {
          type:
            "memory_result",

          mode:
            analysis.action,

          answer:
            "Anna muistiehdotuksen numero. Esimerkiksi: hyväksy muistiehdotus 3.",

          memories:
            [],

          proposals:
            [],

          affectedMemory:
            null,

          proposalId:
            null,

          requestId:
            request.requestId,

          source:
            runtimeContext.source,
        }
      }

      if (
        analysis.action ===
        MEMORY_ACTIONS
          .APPROVE_PROPOSAL
      ) {
        const memory =
          await approveMemoryProposal(
            analysis.proposalId,
            {
              prismaClient:
                prisma,
            },
          )

        return {
          type:
            "memory_result",

          mode:
            MEMORY_ACTIONS
              .APPROVE_PROPOSAL,

          answer:
            memory
              ? `Muistiehdotus ${analysis.proposalId} hyväksyttiin ja tallennettiin pysyvään muistiin.`
              : `Muistiehdotusta ${analysis.proposalId} ei löytynyt tai sitä ei voitu hyväksyä.`,

          memories:
            memory
              ? [
                  memory,
                ]
              : [],

          proposals:
            [],

          affectedMemory:
            memory,

          proposalId:
            analysis.proposalId,

          requestId:
            request.requestId,

          source:
            runtimeContext.source,
        }
      }

      if (
        analysis.action ===
        MEMORY_ACTIONS
          .REJECT_PROPOSAL
      ) {
        const proposal =
          await rejectMemoryProposal(
            analysis.proposalId,
            {
              prismaClient:
                prisma,
            },
          )

        return {
          type:
            "memory_result",

          mode:
            MEMORY_ACTIONS
              .REJECT_PROPOSAL,

          answer:
            proposal
              ? `Muistiehdotus ${analysis.proposalId} hylättiin.`
              : `Muistiehdotusta ${analysis.proposalId} ei löytynyt tai sitä ei voitu hylätä.`,

          memories:
            [],

          proposals:
            proposal
              ? [
                  proposal,
                ]
              : [],

          affectedMemory:
            null,

          proposalId:
            analysis.proposalId,

          requestId:
            request.requestId,

          source:
            runtimeContext.source,
        }
      }

      throw new Error(
        "Memory Module sai tuntemattoman muistitoiminnon.",
      )
    },
  })
}


export {
  MEMORY_ACTIONS,
  analyzeMemoryRequest,
  createMemoryModule,
}
