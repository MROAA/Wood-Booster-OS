/*
=====================================
WOOD-BOOSTER AI BRAIN V2

DECISION MODULE

Vastuut:
- vastaanottaa Reasoning Modulen
  tuottaman analyysin
- muodostaa rakenteisen päätöksen
- valitsee suositellun kohdemoduulin
- tunnistaa, tarvitaanko lisätietoja

Decision Module ei:
- analysoi raakaa käyttäjäviestiä
- suorita toimintoja
- kutsu muita moduuleja
- kirjoita tietokantaan
- kutsu kielimallia
=====================================
*/


import {
  createBrainModule,
} from "../moduleContract.js"


const supportedTargetModules = [
  "action",
  "memory",
  "knowledge",
  "conversation",
]


function normalizeConfidence(value) {
  const confidence =
    Number(value)

  if (!Number.isFinite(confidence)) {
    return 0
  }

  if (confidence < 0) {
    return 0
  }

  if (confidence > 1) {
    return 1
  }

  return confidence
}


function normalizeReasoningAnalysis(
  value,
) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null
  }

  const domains =
    Array.isArray(value.domains)
      ? value.domains
          .map(
            (domain) =>
              String(domain || "")
                .trim()
                .toLowerCase(),
          )
          .filter(Boolean)
      : []

  const missingInformation =
    Array.isArray(
      value.missingInformation,
    )
      ? value.missingInformation
          .map(
            (item) =>
              String(item || "")
                .trim(),
          )
          .filter(Boolean)
      : []

  const moduleNeeds =
    value.moduleNeeds &&
    typeof value.moduleNeeds ===
      "object" &&
    !Array.isArray(
      value.moduleNeeds,
    )
      ? value.moduleNeeds
      : {}

  return {
    intent:
      String(
        value.intent ||
        "conversation",
      )
        .trim()
        .toLowerCase(),

    domains,

    isQuestion:
      value.isQuestion === true,

    requiresAction:
      value.requiresAction === true,

    moduleNeeds: {
      action:
        moduleNeeds.action ===
        true,

      memory:
        moduleNeeds.memory ===
        true,

      knowledge:
        moduleNeeds.knowledge ===
        true,

      conversation:
        moduleNeeds.conversation ===
        true,

      project:
        moduleNeeds.project ===
        true,

      customer:
        moduleNeeds.customer ===
        true,
    },

    missingInformation,

    confidence:
      normalizeConfidence(
        value.confidence,
      ),
  }
}


function selectTargetModule(
  analysis,
) {
  if (
    analysis.moduleNeeds.memory
  ) {
    return "memory"
  }

  if (
    analysis.moduleNeeds.knowledge &&
    !analysis.requiresAction
  ) {
    return "knowledge"
  }

  if (
    analysis.moduleNeeds.action ||
    analysis.requiresAction
  ) {
    return "action"
  }

  return "conversation"
}


function createDecisionReason({
  decision,
  targetModule,
  analysis,
}) {
  if (
    decision === "clarify"
  ) {
    return (
      "Pyyntö tarvitsee lisätietoja ennen " +
      "kuin se voidaan delegoida moduulille."
    )
  }

  if (
    decision === "respond"
  ) {
    return (
      "Pyyntö voidaan käsitellä " +
      "keskusteluna ilman järjestelmätoimintoa."
    )
  }

  if (
    targetModule === "memory"
  ) {
    return (
      "Reasoning-analyysi tunnisti " +
      "muistiin liittyvän pyynnön."
    )
  }

  if (
    targetModule === "knowledge"
  ) {
    return (
      "Reasoning-analyysi tunnisti " +
      "tietopankkiin liittyvän pyynnön."
    )
  }

  if (
    targetModule === "action"
  ) {
    return (
      "Reasoning-analyysi tunnisti " +
      "järjestelmätoimintoa vaativan pyynnön."
    )
  }

  return (
    `Reasoning-analyysin intentti on ` +
    `"${analysis.intent}".`
  )
}


function calculateDecisionConfidence({
  analysis,
  decision,
}) {
  let confidence =
    analysis.confidence

  if (
    decision === "clarify"
  ) {
    confidence =
      Math.min(
        confidence,
        0.6,
      )
  }

  if (
    decision === "respond" &&
    confidence < 0.4
  ) {
    confidence = 0.4
  }

  return Number(
    confidence.toFixed(2),
  )
}


function createDecision(
  reasoningAnalysis,
) {
  const analysis =
    normalizeReasoningAnalysis(
      reasoningAnalysis,
    )

  if (!analysis) {
    return {
      decision:
        "clarify",

      targetModule:
        null,

      reason:
        "Reasoning-analyysi puuttuu tai sen rakenne ei ole kelvollinen.",

      confidence:
        0,

      missingInformation: [
        "reasoning_analysis",
      ],

      analysis:
        null,
    }
  }

  const targetModule =
    selectTargetModule(
      analysis,
    )

  const hasMissingInformation =
    analysis.missingInformation
      .length > 0

  let decision =
    "delegate"

  if (hasMissingInformation) {
    decision =
      "clarify"
  } else if (
    targetModule ===
    "conversation"
  ) {
    decision =
      "respond"
  }

  const safeTargetModule =
    supportedTargetModules
      .includes(
        targetModule,
      )
      ? targetModule
      : null

  return {
    decision,

    targetModule:
      decision === "clarify"
        ? null
        : safeTargetModule,

    reason:
      createDecisionReason({
        decision,
        targetModule:
          safeTargetModule,
        analysis,
      }),

    confidence:
      calculateDecisionConfidence({
        analysis,
        decision,
      }),

    missingInformation:
      analysis.missingInformation,

    analysis,
  }
}


function getReasoningAnalysis({
  request,
  runtimeContext,
}) {
  return (
    runtimeContext
      ?.reasoningAnalysis ||
    runtimeContext
      ?.reasoningResult
      ?.analysis ||
    request
      ?.reasoningAnalysis ||
    request
      ?.reasoningResult
      ?.analysis ||
    null
  )
}


function createDecisionModule() {
  return createBrainModule({
    id:
      "decision",

    name:
      "Decision Module",

    version:
      "1.0.0",

    description:
      "Muodostaa Reasoning-analyysistä rakenteisen moduulipäätöksen.",

    priority:
      40,

    canHandle({
      request,
      runtimeContext,
    }) {
      const decisionRequested =
        runtimeContext
          ?.decisionOnly ===
        true

      const reasoningAnalysis =
        getReasoningAnalysis({
          request,
          runtimeContext,
        })

      const hasReasoningAnalysis =
        reasoningAnalysis !==
          null

      return {
        matched:
          decisionRequested &&
          hasReasoningAnalysis,

        confidence:
          decisionRequested &&
          hasReasoningAnalysis
            ? 1
            : 0,

        reason:
          !decisionRequested
            ? "Decision Modulea ei suoriteta oletusreitityksessä."
            : !hasReasoningAnalysis
              ? "Reasoning-analyysi puuttuu."
              : "Päätöksen muodostamista pyydettiin erikseen.",

        metadata: {
          decisionOnly:
            decisionRequested,

          hasReasoningAnalysis,
        },
      }
    },

    async execute({
      request,
      runtimeContext,
    }) {
      const reasoningAnalysis =
        getReasoningAnalysis({
          request,
          runtimeContext,
        })

      const decision =
        createDecision(
          reasoningAnalysis,
        )

      return {
        type:
          "decision_result",

        requestId:
          request.requestId,

        decision:
          decision.decision,

        targetModule:
          decision.targetModule,

        reason:
          decision.reason,

        confidence:
          decision.confidence,

        missingInformation:
          decision.missingInformation,

        analysis:
          decision.analysis,
      }
    },
  })
}


export {
  createDecision,
  createDecisionModule,
  normalizeReasoningAnalysis,
}
