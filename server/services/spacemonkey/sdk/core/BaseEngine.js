/**
 * Wood-Booster OS
 * Boosterverse SDK
 *
 * BaseEngine
 *
 * Boosterverse-moottoreiden yhteinen perusluokka.
 *
 * BaseEngine laajentaa BaseModulea ja lisää:
 * - engine state
 * - evaluation cycle
 * - confidence
 * - recommendations
 * - observations
 * - engine statistics
 *
 * Tarkoitus:
 * tehdä uusien Engine-moduulien rakentamisesta
 * mahdollisimman yhdenmukaista ja kevyttä.
 */

import BaseModule from "./BaseModule.js"


const ENGINE_STATUS = Object.freeze({
  IDLE: "idle",
  OBSERVING: "observing",
  EVALUATING: "evaluating",
  READY: "ready",
  DEGRADED: "degraded",
  ERROR: "error",
})


const MAX_OBSERVATIONS = 200
const MAX_RECOMMENDATIONS = 100


class BaseEngine extends BaseModule {
  constructor({
    id,
    name = null,
    version = "1.0.0",
    description = null,
    enabled = true,
    dependencies = [],
    metadata = null,

    confidenceThreshold = 0.5,

    maxObservations = MAX_OBSERVATIONS,
    maxRecommendations = MAX_RECOMMENDATIONS,
  } = {}) {
    super({
      id,
      name,
      version,
      description,
      enabled,
      dependencies,
      metadata,
    })

    this.engineStatus =
      ENGINE_STATUS.IDLE

    this.confidenceThreshold =
      clampNumber(
        confidenceThreshold,
        0,
        1
      )

    this.maxObservations =
      normalizePositiveInteger(
        maxObservations,
        MAX_OBSERVATIONS
      )

    this.maxRecommendations =
      normalizePositiveInteger(
        maxRecommendations,
        MAX_RECOMMENDATIONS
      )

    this.observations = []

    this.recommendations = []

    this.latestEvaluation =
      null

    this.engineMetrics = {
      observations: 0,
      evaluations: 0,
      recommendations: 0,
      acceptedRecommendations: 0,
      rejectedRecommendations: 0,
      lowConfidenceEvaluations: 0,
    }
  }


  /**
   * Lisää havainnon engineen.
   */
  observe({
    type = "observation",
    value = null,
    source = "system",
    confidence = 1,
    importance = 0.5,
    metadata = null,
  } = {}) {
    const observation = {
      id:
        createId(
          `${this.id}-observation`
        ),

      type:
        sanitizeString(type) ||
        "observation",

      value:
        cloneSafe(value),

      source:
        sanitizeString(source) ||
        "system",

      confidence:
        clampNumber(
          confidence,
          0,
          1
        ),

      importance:
        clampNumber(
          importance,
          0,
          1
        ),

      metadata:
        cloneSafe(metadata),

      createdAt:
        new Date().toISOString(),
    }

    this.observations.push(
      observation
    )

    this.engineMetrics
      .observations += 1

    this.trimObservations()

    this.engineStatus =
      ENGINE_STATUS.OBSERVING

    this.touch()

    this.recordHistory(
      "engine-observation",
      {
        observationId:
          observation.id,

        type:
          observation.type,

        confidence:
          observation.confidence,

        importance:
          observation.importance,
      }
    )

    return {
      success: true,
      observation:
        cloneSafe(
          observation
        ),
    }
  }


  /**
   * Suorittaa yhden evaluation-cyclen.
   *
   * Aliluokka toteuttaa onEvaluate().
   */
  async evaluate(
    input = null,
    context = null
  ) {
    if (!this.enabled) {
      return {
        success: false,
        skipped: true,
        reason:
          "engine-disabled",
      }
    }

    this.engineMetrics
      .evaluations += 1

    this.engineStatus =
      ENGINE_STATUS.EVALUATING

    this.touch()

    try {
      const result =
        await this.onEvaluate(
          input,
          context,
          this.runtime
        )

      const normalized =
        this.normalizeEvaluation(
          result
        )

      this.latestEvaluation =
        normalized

      if (
        normalized.confidence <
        this.confidenceThreshold
      ) {
        this.engineMetrics
          .lowConfidenceEvaluations += 1
      }

      this.engineStatus =
        normalized.confidence >=
          this.confidenceThreshold
          ? ENGINE_STATUS.READY
          : ENGINE_STATUS.DEGRADED

      this.recordHistory(
        "engine-evaluation",
        {
          evaluationId:
            normalized.id,

          confidence:
            normalized.confidence,

          status:
            this.engineStatus,
        }
      )

      this.touch()

      return {
        success: true,
        evaluation:
          cloneSafe(
            normalized
          ),
      }
    } catch (error) {
      this.engineStatus =
        ENGINE_STATUS.ERROR

      return this.handleError(
        error,
        "engine-evaluate"
      )
    }
  }


  /**
   * Luo engine recommendationin.
   *
   * Recommendation ei tarkoita automaattista toimintaa.
   */
  recommend({
    type = "suggestion",
    title = null,
    description = null,
    action = null,

    confidence = 0.5,
    priority = 0.5,

    requiresApproval = true,

    reason = null,
    evidence = [],

    metadata = null,
  } = {}) {
    const recommendation = {
      id:
        createId(
          `${this.id}-recommendation`
        ),

      engineId:
        this.id,

      type:
        sanitizeString(type) ||
        "suggestion",

      title:
        sanitizeString(title),

      description:
        sanitizeString(
          description
        ),

      action:
        cloneSafe(action),

      confidence:
        clampNumber(
          confidence,
          0,
          1
        ),

      priority:
        clampNumber(
          priority,
          0,
          1
        ),

      requiresApproval:
        Boolean(
          requiresApproval
        ),

      reason:
        sanitizeString(reason),

      evidence:
        normalizeArray(
          evidence
        ),

      metadata:
        cloneSafe(metadata),

      status:
        "open",

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),
    }

    this.recommendations.push(
      recommendation
    )

    this.engineMetrics
      .recommendations += 1

    this.trimRecommendations()

    this.recordHistory(
      "engine-recommendation-created",
      {
        recommendationId:
          recommendation.id,

        type:
          recommendation.type,

        confidence:
          recommendation.confidence,

        priority:
          recommendation.priority,
      }
    )

    this.touch()

    return {
      success: true,
      recommendation:
        cloneSafe(
          recommendation
        ),
    }
  }


  /**
   * Recommendation hyväksytty.
   */
  acceptRecommendation(
    recommendationId,
    {
      approvedByUser = false,
      note = null,
    } = {}
  ) {
    const recommendation =
      this.getRecommendationReference(
        recommendationId
      )

    if (!recommendation) {
      return {
        success: false,
        error:
          "Recommendation not found",
      }
    }

    if (
      recommendation
        .requiresApproval &&
      !approvedByUser
    ) {
      return {
        success: false,
        error:
          "Recommendation requires explicit user approval",
      }
    }

    recommendation.status =
      "accepted"

    recommendation
      .approvedByUser =
      Boolean(
        approvedByUser
      )

    recommendation.note =
      sanitizeString(note)

    recommendation.updatedAt =
      new Date().toISOString()

    this.engineMetrics
      .acceptedRecommendations += 1

    this.recordHistory(
      "engine-recommendation-accepted",
      {
        recommendationId:
          recommendation.id,
      }
    )

    this.touch()

    return {
      success: true,
      recommendation:
        cloneSafe(
          recommendation
        ),
    }
  }


  /**
   * Recommendation hylätty.
   */
  rejectRecommendation(
    recommendationId,
    reason = null
  ) {
    const recommendation =
      this.getRecommendationReference(
        recommendationId
      )

    if (!recommendation) {
      return {
        success: false,
        error:
          "Recommendation not found",
      }
    }

    recommendation.status =
      "rejected"

    recommendation
      .rejectionReason =
      sanitizeString(reason)

    recommendation.updatedAt =
      new Date().toISOString()

    this.engineMetrics
      .rejectedRecommendations += 1

    this.recordHistory(
      "engine-recommendation-rejected",
      {
        recommendationId:
          recommendation.id,

        reason:
          recommendation
            .rejectionReason,
      }
    )

    this.touch()

    return {
      success: true,
      recommendation:
        cloneSafe(
          recommendation
        ),
    }
  }


  /**
   * Recommendation-listaus.
   */
  listRecommendations({
    status = null,
    minConfidence = 0,
    minPriority = 0,
    limit = 50,
  } = {}) {
    return this.recommendations
      .filter(
        (item) => {
          if (
            status &&
            item.status !== status
          ) {
            return false
          }

          if (
            item.confidence <
            clampNumber(
              minConfidence,
              0,
              1
            )
          ) {
            return false
          }

          if (
            item.priority <
            clampNumber(
              minPriority,
              0,
              1
            )
          ) {
            return false
          }

          return true
        }
      )
      .sort(
        (a, b) => {
          const scoreA =
            a.priority *
            a.confidence

          const scoreB =
            b.priority *
            b.confidence

          return (
            scoreB -
            scoreA
          )
        }
      )
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 50
        )
      )
      .map(cloneSafe)
  }


  /**
   * Havaintojen listaus.
   */
  listObservations({
    type = null,
    minConfidence = 0,
    minImportance = 0,
    limit = 50,
  } = {}) {
    return this.observations
      .filter(
        (observation) => {
          if (
            type &&
            observation.type !==
              type
          ) {
            return false
          }

          if (
            observation.confidence <
            clampNumber(
              minConfidence,
              0,
              1
            )
          ) {
            return false
          }

          if (
            observation.importance <
            clampNumber(
              minImportance,
              0,
              1
            )
          ) {
            return false
          }

          return true
        }
      )
      .sort(
        (a, b) => {
          const scoreA =
            a.importance *
            a.confidence

          const scoreB =
            b.importance *
            b.confidence

          return (
            scoreB -
            scoreA
          )
        }
      )
      .slice(
        0,
        Math.max(
          1,
          Number(limit) || 50
        )
      )
      .map(cloneSafe)
  }


  /**
   * Viimeisin evaluation.
   */
  getLatestEvaluation() {
    return this.latestEvaluation
      ? cloneSafe(
          this.latestEvaluation
        )
      : null
  }


  /**
   * Engine context AI:lle tai muille moduuleille.
   */
  async onContext() {
    return {
      engineId:
        this.id,

      engineStatus:
        this.engineStatus,

      latestEvaluation:
        this.latestEvaluation
          ? cloneSafe(
              this.latestEvaluation
            )
          : null,

      openRecommendations:
        this.listRecommendations({
          status: "open",
          limit: 5,
        }),

      recentObservations:
        this.listObservations({
          limit: 5,
        }),
    }
  }


  /**
   * Engine health.
   */
  async onHealth() {
    return {
      healthy:
        this.engineStatus !==
        ENGINE_STATUS.ERROR,

      engineStatus:
        this.engineStatus,

      confidenceThreshold:
        this.confidenceThreshold,

      latestConfidence:
        this.latestEvaluation
          ?.confidence ??
        null,

      observations:
        this.observations.length,

      recommendations:
        this.recommendations.length,
    }
  }


  /**
   * Snapshot.
   */
  async onSnapshot() {
    return {
      engineStatus:
        this.engineStatus,

      confidenceThreshold:
        this.confidenceThreshold,

      latestEvaluation:
        cloneSafe(
          this.latestEvaluation
        ),

      observations:
        this.listObservations({
          limit: 20,
        }),

      recommendations:
        this.listRecommendations({
          limit: 20,
        }),

      engineMetrics:
        cloneSafe(
          this.engineMetrics
        ),
    }
  }


  /**
   * Reset.
   */
  async onReset() {
    this.engineStatus =
      ENGINE_STATUS.IDLE

    this.observations = []

    this.recommendations = []

    this.latestEvaluation =
      null

    this.engineMetrics = {
      observations: 0,
      evaluations: 0,
      recommendations: 0,
      acceptedRecommendations: 0,
      rejectedRecommendations: 0,
      lowConfidenceEvaluations: 0,
    }

    return {
      success: true,
    }
  }


  /**
   * Engine metricit BaseModule-metriikoiden päälle.
   */
  metrics() {
    return {
      ...super.metrics(),

      engine:
        cloneSafe(
          this.engineMetrics
        ),

      engineStatus:
        this.engineStatus,

      confidenceThreshold:
        this.confidenceThreshold,

      latestConfidence:
        this.latestEvaluation
          ?.confidence ??
        null,
    }
  }


  /**
   * Override-hook aliluokille.
   *
   * Esimerkki:
   *
   * async onEvaluate(input, context, runtime) {
   *   return {
   *     confidence: 0.9,
   *     result: {}
   *   }
   * }
   */
  async onEvaluate(
    input,
    context,
    runtime
  ) {
    return {
      confidence: 0,
      result: null,
      input:
        cloneSafe(input),
      contextAvailable:
        Boolean(context),
      runtimeAvailable:
        Boolean(runtime),
    }
  }


  /**
   * Evaluation-muodon normalisointi.
   */
  normalizeEvaluation(
    evaluation
  ) {
    const now =
      new Date().toISOString()

    if (
      evaluation === null ||
      evaluation === undefined
    ) {
      return {
        id:
          createId(
            `${this.id}-evaluation`
          ),

        confidence: 0,

        result: null,

        reason:
          "No evaluation result",

        metadata: null,

        createdAt:
          now,
      }
    }

    if (
      typeof evaluation !==
      "object"
    ) {
      return {
        id:
          createId(
            `${this.id}-evaluation`
          ),

        confidence: 0.5,

        result:
          cloneSafe(
            evaluation
          ),

        reason: null,

        metadata: null,

        createdAt:
          now,
      }
    }

    return {
      id:
        sanitizeString(
          evaluation.id
        ) ||
        createId(
          `${this.id}-evaluation`
        ),

      confidence:
        clampNumber(
          evaluation
            .confidence ??
          0.5,
          0,
          1
        ),

      result:
        cloneSafe(
          evaluation.result ??
          evaluation.value ??
          null
        ),

      reason:
        sanitizeString(
          evaluation.reason
        ),

      evidence:
        normalizeArray(
          evaluation.evidence
        ),

      metadata:
        cloneSafe(
          evaluation.metadata
        ),

      createdAt:
        evaluation.createdAt ??
        now,
    }
  }


  /**
   * Sisäinen recommendation-reference.
   */
  getRecommendationReference(
    recommendationId
  ) {
    const id =
      sanitizeString(
        recommendationId
      )

    return (
      this.recommendations.find(
        (item) =>
          item.id === id
      ) ||
      null
    )
  }


  trimObservations() {
    if (
      this.observations.length >
      this.maxObservations
    ) {
      this.observations =
        this.observations.slice(
          -this.maxObservations
        )
    }
  }


  trimRecommendations() {
    if (
      this.recommendations.length >
      this.maxRecommendations
    ) {
      this.recommendations =
        this.recommendations.slice(
          -this.maxRecommendations
        )
    }
  }
}


/**
 * Helpers
 */

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


function sanitizeString(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const string =
    String(value).trim()

  return string || null
}


function clampNumber(
  value,
  min,
  max
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return min
  }

  return Math.min(
    Math.max(
      number,
      min
    ),
    max
  )
}


function normalizePositiveInteger(
  value,
  fallback
) {
  const number =
    Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.max(
    1,
    Math.floor(number)
  )
}


function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return cloneSafe(value) || []
}


function cloneSafe(value) {
  if (
    value === undefined
  ) {
    return null
  }

  try {
    return JSON.parse(
      JSON.stringify(value)
    )
  } catch {
    return null
  }
}


export {
  ENGINE_STATUS,
  BaseEngine,
}


export default BaseEngine
