/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MODULE ROUTER

Vastuut:
- kysyy moduuleilta, voivatko ne
  käsitellä pyynnön
- vertailee moduulien pisteitä
- valitsee parhaan moduulin
- palauttaa reitityspäätöksen

Tämä tiedosto ei:
- suorita moduulia
- muuta moduulirekisteriä
- kutsu kielimallia
=====================================
*/


import {
  getRegisteredBrainModules,
} from "./moduleRegistry.js"


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


function createRouteCandidate({
  moduleDefinition,
  result,
}) {
  if (
    result === true
  ) {
    return {
      module:
        moduleDefinition,

      matched:
        true,

      confidence:
        1,

      reason:
        "Moduuli hyväksyi pyynnön.",

      metadata:
        null,
    }
  }

  if (
    !result ||
    typeof result !== "object"
  ) {
    return {
      module:
        moduleDefinition,

      matched:
        false,

      confidence:
        0,

      reason:
        "Moduuli ei hyväksynyt pyyntöä.",

      metadata:
        null,
    }
  }

  const confidence =
    normalizeConfidence(
      result.confidence,
    )

  return {
    module:
      moduleDefinition,

    matched:
      result.matched === true ||
      confidence > 0,

    confidence,

    reason:
      String(
        result.reason ||
        "",
      ).trim(),

    metadata:
      result.metadata ||
      null,
  }
}


async function evaluateBrainModule({
  moduleDefinition,
  request,
  runtimeContext,
}) {
  try {
    const result =
      await moduleDefinition.canHandle({
        request,
        runtimeContext,
      })

    return createRouteCandidate({
      moduleDefinition,
      result,
    })
  } catch (error) {
    return {
      module:
        moduleDefinition,

      matched:
        false,

      confidence:
        0,

      reason:
        "Moduulin canHandle-funktio epäonnistui.",

      metadata: {
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
    }
  }
}


function compareRouteCandidates(
  firstCandidate,
  secondCandidate,
) {
  if (
    firstCandidate.confidence !==
    secondCandidate.confidence
  ) {
    return (
      secondCandidate.confidence -
      firstCandidate.confidence
    )
  }

  return (
    firstCandidate.module.priority -
    secondCandidate.module.priority
  )
}


async function routeBrainRequest({
  request,
  runtimeContext = {},
} = {}) {
  const modules =
    getRegisteredBrainModules()

  if (modules.length === 0) {
    return {
      matched:
        false,

      module:
        null,

      confidence:
        0,

      reason:
        "AI Brain -moduuleja ei ole rekisteröity.",

      candidates:
        [],
    }
  }

  const candidates =
    await Promise.all(
      modules.map(
        (moduleDefinition) =>
          evaluateBrainModule({
            moduleDefinition,
            request,
            runtimeContext,
          }),
      ),
    )

  const matchedCandidates =
    candidates
      .filter(
        (candidate) =>
          candidate.matched,
      )
      .sort(
        compareRouteCandidates,
      )

  const selectedCandidate =
    matchedCandidates[0] ||
    null

  if (!selectedCandidate) {
    return {
      matched:
        false,

      module:
        null,

      confidence:
        0,

      reason:
        "Yksikään AI Brain -moduuli ei hyväksynyt pyyntöä.",

      candidates,
    }
  }

  return {
    matched:
      true,

    module:
      selectedCandidate.module,

    confidence:
      selectedCandidate.confidence,

    reason:
      selectedCandidate.reason,

    metadata:
      selectedCandidate.metadata,

    candidates,
  }
}


export {
  routeBrainRequest,
}
