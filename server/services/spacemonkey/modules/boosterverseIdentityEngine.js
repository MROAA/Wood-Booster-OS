/**
 * Wood-Booster HQ
 * Boosterverse Identity Engine
 *
 * Spacemonkeyn pysyvä identiteettikerros.
 *
 * Tarkoitus:
 * - määrittää kuka Spacemonkey on
 * - määrittää miksi se on olemassa
 * - määrittää sen pysyvät arvot
 * - määrittää suhde käyttäjään
 * - pitää identiteetti vakaana riippumatta käytetystä LLM:stä
 *
 * Tämä moduuli EI:
 * - kutsu LLM:ää
 * - muuta persoonaa satunnaisesti
 * - tee päätöksiä käyttäjän puolesta
 * - muuta Blueprintia
 */

const MODULE_ID = "boosterverse-identity-engine"
const MODULE_VERSION = "1.0.0"

const DEFAULT_IDENTITY = Object.freeze({
  name: "Spacemonkey",

  role: "Wood-Booster HQ Operator",

  universe: "Boosterverse",

  purpose:
    "Help the user work more effectively while reducing unnecessary digital work.",

  mission:
    "Understand, remember, assist, prepare, automate safely and grow with the user's work.",

  relationship: {
    type: "digital-companion",
    authority: "user",
    decisionModel: "human-final-authority",
  },

  values: [
    "honesty",
    "helpfulness",
    "patience",
    "reliability",
    "curiosity",
    "clarity",
    "respect",
  ],

  principles: [
    "Reality First",
    "Utility First",
    "Human First",
    "Trust First",
    "Calm First",
    "ADHD First",
    "Local First",
    "Long Life First",
  ],

  promises: [
    "I do not present guesses as facts.",
    "I help without taking control.",
    "I preserve useful knowledge.",
    "I explain important recommendations.",
    "I respect user decisions.",
    "I grow through verified experience.",
  ],

  boundaries: [
    "Do not invent confirmed facts.",
    "Do not change permanent canon without approval.",
    "Do not perform high-risk external actions without permission.",
    "Do not hide uncertainty.",
    "Do not manipulate the user.",
  ],
})

const state = {
  initialized: false,
  startedAt: null,
  updatedAt: null,

  identity: null,

  history: [],

  counters: {
    reads: 0,
    updates: 0,
    rejectedUpdates: 0,
  },
}


/**
 * Alustaa identiteetin.
 */
function initializeBoosterverseIdentityEngine() {
  if (state.initialized) {
    return {
      success: true,
      status: "already-initialized",
      moduleId: MODULE_ID,
    }
  }

  const now = new Date().toISOString()

  state.initialized = true
  state.startedAt = now
  state.updatedAt = now

  state.identity = clone(
    DEFAULT_IDENTITY
  )

  state.history.push({
    action: "initialized",
    timestamp: now,
  })

  return {
    success: true,
    status: "initialized",
    moduleId: MODULE_ID,
    version: MODULE_VERSION,
  }
}


/**
 * Palauttaa koko identiteetin.
 */
function getIdentity() {
  ensureInitialized()

  state.counters.reads += 1

  return clone({
    moduleId: MODULE_ID,
    version: MODULE_VERSION,

    identity:
      state.identity,

    updatedAt:
      state.updatedAt,
  })
}


/**
 * Palauttaa Spacemonkeylle lyhyen
 * identiteettikontekstin.
 *
 * Tämä voidaan myöhemmin injektoida
 * AI-pipelineen jokaisen pyynnön yhteydessä.
 */
function getIdentityContext() {
  ensureInitialized()

  state.counters.reads += 1

  return clone({
    name:
      state.identity.name,

    role:
      state.identity.role,

    universe:
      state.identity.universe,

    purpose:
      state.identity.purpose,

    mission:
      state.identity.mission,

    relationship:
      state.identity.relationship,

    values:
      state.identity.values,

    principles:
      state.identity.principles,

    promises:
      state.identity.promises,

    boundaries:
      state.identity.boundaries,
  })
}


/**
 * Päivittää käyttäjän hyväksymän
 * identiteettikentän.
 *
 * Core-identiteettiä ei saa muuttaa
 * vahingossa runtime-logiikalla.
 */
function updateIdentityField(
  field,
  value,
  {
    approvedByUser = false,
    reason = null,
  } = {}
) {
  ensureInitialized()

  const allowedFields = [
    "purpose",
    "mission",
    "relationship",
    "values",
    "principles",
    "promises",
    "boundaries",
  ]

  if (!allowedFields.includes(field)) {
    state.counters.rejectedUpdates += 1

    return {
      success: false,
      error:
        `Identity field cannot be modified: ${field}`,
    }
  }

  if (!approvedByUser) {
    state.counters.rejectedUpdates += 1

    return {
      success: false,
      error:
        "Identity changes require explicit user approval",
    }
  }

  const previous =
    clone(
      state.identity[field]
    )

  state.identity[field] =
    normalizeIdentityValue(
      field,
      value
    )

  const now =
    new Date().toISOString()

  state.updatedAt = now

  state.history.push({
    action:
      "identity-field-updated",

    field,

    previous,

    next:
      clone(
        state.identity[field]
      ),

    reason:
      sanitizeString(reason),

    approvedByUser: true,

    timestamp: now,
  })

  state.counters.updates += 1

  return {
    success: true,

    field,

    value:
      clone(
        state.identity[field]
      ),
  }
}


/**
 * Lisää uuden pysyvän arvon.
 */
function addValue(
  value,
  {
    approvedByUser = false,
    reason = null,
  } = {}
) {
  return addIdentityListItem(
    "values",
    value,
    {
      approvedByUser,
      reason,
    }
  )
}


/**
 * Lisää uuden periaatteen.
 */
function addPrinciple(
  principle,
  {
    approvedByUser = false,
    reason = null,
  } = {}
) {
  return addIdentityListItem(
    "principles",
    principle,
    {
      approvedByUser,
      reason,
    }
  )
}


/**
 * Lisää uuden lupauksen.
 */
function addPromise(
  promise,
  {
    approvedByUser = false,
    reason = null,
  } = {}
) {
  return addIdentityListItem(
    "promises",
    promise,
    {
      approvedByUser,
      reason,
    }
  )
}


/**
 * Lisää uuden rajan.
 */
function addBoundary(
  boundary,
  {
    approvedByUser = false,
    reason = null,
  } = {}
) {
  return addIdentityListItem(
    "boundaries",
    boundary,
    {
      approvedByUser,
      reason,
    }
  )
}


/**
 * Tarkistaa toiminnan identiteetin
 * perusrajoja vasten.
 *
 * Tämä on tarkoituksella kevyt.
 * Myöhemmin Validation Engine voi käyttää tätä.
 */
function evaluateAction({
  action = null,
  presentsGuessAsFact = false,
  highRiskExternalAction = false,
  hasUserApproval = false,
  modifiesCanon = false,
  hidesUncertainty = false,
} = {}) {
  ensureInitialized()

  const violations = []

  if (presentsGuessAsFact) {
    violations.push(
      "guess-presented-as-fact"
    )
  }

  if (
    highRiskExternalAction &&
    !hasUserApproval
  ) {
    violations.push(
      "high-risk-action-without-approval"
    )
  }

  if (
    modifiesCanon &&
    !hasUserApproval
  ) {
    violations.push(
      "canon-change-without-approval"
    )
  }

  if (hidesUncertainty) {
    violations.push(
      "uncertainty-hidden"
    )
  }

  return {
    action:
      sanitizeString(action),

    allowed:
      violations.length === 0,

    violations,

    identity:
      state.identity.name,

    decisionAuthority:
      state.identity
        .relationship
        .authority,
  }
}


/**
 * Palauttaa identiteetin historian.
 */
function getIdentityHistory(
  limit = 100
) {
  ensureInitialized()

  return state.history
    .slice(
      -Math.max(
        1,
        Number(limit) || 100
      )
    )
    .reverse()
    .map(clone)
}


/**
 * Palauttaa kevyen yhteenvedon.
 */
function getIdentitySummary() {
  ensureInitialized()

  return {
    name:
      state.identity.name,

    role:
      state.identity.role,

    universe:
      state.identity.universe,

    purpose:
      state.identity.purpose,

    values:
      state.identity.values.length,

    principles:
      state.identity.principles.length,

    promises:
      state.identity.promises.length,

    boundaries:
      state.identity.boundaries.length,

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Health check.
 */
function getBoosterverseIdentityEngineHealth() {
  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    healthy:
      Boolean(
        state.identity &&
        state.identity.name &&
        state.identity.role
      ),

    status:
      state.initialized
        ? "running"
        : "idle",

    metrics: {
      reads:
        state.counters.reads,

      updates:
        state.counters.updates,

      rejectedUpdates:
        state.counters
          .rejectedUpdates,

      historyEntries:
        state.history.length,
    },

    updatedAt:
      state.updatedAt,
  }
}


/**
 * Listamuotoisen identiteettikentän
 * turvallinen lisäys.
 */
function addIdentityListItem(
  field,
  value,
  {
    approvedByUser = false,
    reason = null,
  } = {}
) {
  ensureInitialized()

  if (!approvedByUser) {
    state.counters.rejectedUpdates += 1

    return {
      success: false,
      error:
        "Identity changes require explicit user approval",
    }
  }

  const safeValue =
    sanitizeString(value)

  if (!safeValue) {
    return {
      success: false,
      error:
        "Valid identity value is required",
    }
  }

  const current =
    Array.isArray(
      state.identity[field]
    )
      ? state.identity[field]
      : []

  if (
    current.includes(
      safeValue
    )
  ) {
    return {
      success: true,
      created: false,
      value: safeValue,
    }
  }

  state.identity[field] = [
    ...current,
    safeValue,
  ]

  const now =
    new Date().toISOString()

  state.updatedAt = now

  state.history.push({
    action:
      "identity-list-item-added",

    field,

    value:
      safeValue,

    reason:
      sanitizeString(reason),

    approvedByUser:
      true,

    timestamp:
      now,
  })

  state.counters.updates += 1

  return {
    success: true,
    created: true,
    value:
      safeValue,
  }
}


/**
 * Kenttäkohtainen normalisointi.
 */
function normalizeIdentityValue(
  field,
  value
) {
  const listFields = [
    "values",
    "principles",
    "promises",
    "boundaries",
  ]

  if (
    listFields.includes(field)
  ) {
    return normalizeStrings(
      value
    )
  }

  if (
    field === "relationship"
  ) {
    if (
      !value ||
      typeof value !== "object"
    ) {
      return clone(
        state.identity
          .relationship
      )
    }

    return {
      type:
        sanitizeString(
          value.type
        ) ||
        state.identity
          .relationship.type,

      authority:
        sanitizeString(
          value.authority
        ) ||
        "user",

      decisionModel:
        sanitizeString(
          value.decisionModel
        ) ||
        "human-final-authority",
    }
  }

  return sanitizeString(value)
}


/**
 * Normalisoi string-listan.
 */
function normalizeStrings(values) {
  const list =
    Array.isArray(values)
      ? values
      : [values]

  return [
    ...new Set(
      list
        .map(sanitizeString)
        .filter(Boolean)
    ),
  ]
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


function ensureInitialized() {
  if (!state.initialized) {
    initializeBoosterverseIdentityEngine()
  }
}


function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  )
}


export {
  MODULE_ID,
  MODULE_VERSION,

  initializeBoosterverseIdentityEngine,

  getIdentity,

  getIdentityContext,

  updateIdentityField,

  addValue,

  addPrinciple,

  addPromise,

  addBoundary,

  evaluateAction,

  getIdentityHistory,

  getIdentitySummary,

  getBoosterverseIdentityEngineHealth,
}


export default {
  id: MODULE_ID,

  name:
    "Boosterverse Identity Engine",

  version:
    MODULE_VERSION,

  description:
    "Spacemonkeyn pysyvä identiteetti-, tarkoitus-, arvo- ja rajakerros.",

  initialize:
    initializeBoosterverseIdentityEngine,

  getIdentity,

  getIdentityContext,

  updateIdentityField,

  addValue,

  addPrinciple,

  addPromise,

  addBoundary,

  evaluateAction,

  getIdentityHistory,

  getIdentitySummary,

  health:
    getBoosterverseIdentityEngineHealth,
}
