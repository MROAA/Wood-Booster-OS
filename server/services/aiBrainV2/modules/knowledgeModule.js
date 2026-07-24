/*
=====================================
WOOD-BOOSTER AI BRAIN V2

KNOWLEDGE MODULE

Vastuut:
- tunnistaa tietopankkiin liittyvät kysymykset
- hakee tiedostopohjaista tietoa
- välittää tiedon nykyiselle AI Brainille
- antaa nykyisen AI Brainin hakea lisäksi
  tietokantatiedon Prismalla
- palauttaa yhtenäisen AI Brain v2 -tuloksen

Tämä tiedosto ei:
- muuta nykyistä AI Brainia
- kirjoita tietopankkiin
- muuta tietokannan sisältöä
- toteuta omaa kielimallia
=====================================
*/


import {
  runAIBrain,
} from "../../aiBrain.js"

import {
  searchKnowledge,
} from "../../knowledgeSearch.js"

import {
  createBrainModule,
} from "../moduleContract.js"


const KNOWLEDGE_KEYWORDS = [
  "mitä tiedät",
  "kerro mitä tiedät",
  "hae tietoa",
  "etsi tietoa",
  "tietopankki",
  "knowledge",
  "wood-booster",
  "puustaaja",
  "aurora",
  "jokipöytä",
  "river table",
  "epoksi",
  "epoxy",
  "massiivipuu",
  "materiaali",
  "valmistus",
  "tuote",
  "brändi",
  "brand",
  "arvot",
  "filosofia",
  "hinnoittelu",
  "hinta",
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


function analyzeKnowledgeRequest(
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

      matchedKeywords:
        [],
    }
  }

  const matchedKeywords =
    KNOWLEDGE_KEYWORDS.filter(
      (keyword) =>
        normalizedMessage.includes(
          keyword,
        ),
    )

  if (
    matchedKeywords.length === 0
  ) {
    return {
      matched:
        false,

      confidence:
        0,

      reason:
        "Viesti ei sisällä tunnistettua tietokysymystä.",

      matchedKeywords:
        [],
    }
  }

  const confidence =
    Math.min(
      0.7 +
        matchedKeywords.length *
          0.05,
      0.95,
    )

  return {
    matched:
      true,

    confidence,

    reason:
      "Viesti sisältää tietopankkiin liittyvän kysymyksen.",

    matchedKeywords,
  }
}


function normalizeKnowledgeResults(
  results,
) {
  if (!Array.isArray(results)) {
    return []
  }

  return results.map(
    (item) => ({
      name:
        item.file ||
        item.name ||
        "Tuntematon lähde",

      content:
        item.content ||
        "",

      source:
        item.source ||
        "knowledge-file",

      score:
        Number(
          item.score ||
          0,
        ),
    }),
  )
}


function createKnowledgeModule() {
  return createBrainModule({
    id:
      "knowledge",

    name:
      "Knowledge Module",

    version:
      "1.0.0",

    description:
      "Hakee tietoa Wood-Boosterin tiedosto- ja tietokantapohjaisesta tietopankista.",

    priority:
      200,

    canHandle({
      request,
    }) {
      const analysis =
        analyzeKnowledgeRequest(
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
                matchedKeywords:
                  analysis.matchedKeywords,
              }
            : null,
      }
    },

    async execute({
      message,
      request,
      runtimeContext,
    }) {
      const fileKnowledge =
        await searchKnowledge(
          message,
        )

      const normalizedKnowledge =
        normalizeKnowledgeResults(
          fileKnowledge,
        )

      const aiResult =
        await runAIBrain({
          message,

          knowledge:
            normalizedKnowledge,

          conversation:
            runtimeContext.conversation ||
            [],

          model:
            runtimeContext.model,

          prisma:
            runtimeContext.prisma,
        })

      return {
        type:
          "knowledge_result",

        answer:
          aiResult.answer ||
          "",

        model:
          aiResult.model ||
          null,

        requestId:
          request.requestId,

        fileKnowledgeCount:
          normalizedKnowledge.length,

        knowledgeSources:
          normalizedKnowledge.map(
            (item) => ({
              name:
                item.name,

              source:
                item.source,

              score:
                item.score,
            }),
          ),

        memoryProposalCreated:
          aiResult.memoryProposalCreated ||
          false,

        memoryProposal:
          aiResult.memoryProposal ||
          null,

        debug:
          aiResult.debug ||
          null,

        source:
          runtimeContext.source,
      }
    },
  })
}


export {
  analyzeKnowledgeRequest,
  createKnowledgeModule,
  normalizeKnowledgeResults,
}
