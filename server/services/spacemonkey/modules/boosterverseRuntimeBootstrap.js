/**
 * Wood-Booster OS
 * Boosterverse Runtime Bootstrap
 *
 * Tarkoitus:
 * - alustaa Boosterverse-moduulit oikeassa järjestyksessä
 * - rekisteröidä moduulit Runtime Orchestratorille
 * - käynnistää yksi hallittu Boosterverse-runtime
 * - tarjota yksi selkeä bootstrap-funktio testeille ja serverille
 *
 * Tämä moduuli EI:
 * - muuta nykyistä Spacemonkey Corea
 * - suorita workflow'ta automaattisesti
 * - käytä työkaluja
 * - käynnistä korkean riskin toimintoja
 *
 * Ajatus:
 *
 * BOOT
 *  ↓
 * FOUNDATION
 *  ↓
 * COGNITION
 *  ↓
 * ACTION
 *  ↓
 * RUNTIME
 */

import boosterverseEventEngine from "./boosterverseEventEngine.js"
import boosterverseWorldState from "./boosterverseWorldState.js"
import boosterverseAssociationEngine from "./boosterverseAssociationEngine.js"
import boosterverseCanonEngine from "./boosterverseCanonEngine.js"
import boosterverseTrustEngine from "./boosterverseTrustEngine.js"
import boosterverseReflectionEngine from "./boosterverseReflectionEngine.js"

import boosterverseIdentityEngine from "./boosterverseIdentityEngine.js"
import boosterverseFocusEngine from "./boosterverseFocusEngine.js"
import boosterverseIntentEngine from "./boosterverseIntentEngine.js"
import boosterverseGoalEngine from "./boosterverseGoalEngine.js"

import boosterversePlanningEngine from "./boosterversePlanningEngine.js"
import boosterverseCapabilityRegistry from "./boosterverseCapabilityRegistry.js"
import boosterverseToolBus from "./boosterverseToolBus.js"
import boosterverseExecutionEngine from "./boosterverseExecutionEngine.js"
import boosterverseWorkflowEngine from "./boosterverseWorkflowEngine.js"

import boosterverseRuntimeOrchestrator from "./boosterverseRuntimeOrchestrator.js"


const MODULE_ID =
  "boosterverse-runtime-bootstrap"

const MODULE_VERSION =
  "1.0.0"


const bootstrapState = {
  initialized: false,

  started: false,

  initializedAt: null,

  startedAt: null,

  modules: [],

  errors: [],
}


/**
 * Boosterverse-moduulit
 * oikeassa alustamisjärjestyksessä.
 */
const MODULES = [
  boosterverseEventEngine,

  boosterverseWorldState,

  boosterverseAssociationEngine,

  boosterverseCanonEngine,

  boosterverseTrustEngine,

  boosterverseReflectionEngine,

  boosterverseIdentityEngine,

  boosterverseFocusEngine,

  boosterverseIntentEngine,

  boosterverseGoalEngine,

  boosterversePlanningEngine,

  boosterverseCapabilityRegistry,

  boosterverseToolBus,

  boosterverseExecutionEngine,

  boosterverseWorkflowEngine,
]


/**
 * Alustaa kaikki Boosterverse-moduulit.
 *
 * Jos yksittäinen moduuli epäonnistuu,
 * bootstrap pysähtyy.
 */
async function initializeBoosterverseRuntime({
  tickIntervalMs = 1000,
} = {}) {
  if (bootstrapState.initialized) {
    return {
      success: true,

      status:
        "already-initialized",

      moduleId:
        MODULE_ID,

      modules:
        [...bootstrapState.modules],
    }
  }

  bootstrapState.errors = []
  bootstrapState.modules = []

  const runtimeInit =
    boosterverseRuntimeOrchestrator
      .initialize({
        tickIntervalMs,
      })

  if (
    !runtimeInit ||
    runtimeInit.success !== true
  ) {
    return failBootstrap(
      "runtime-orchestrator-initialization-failed",
      runtimeInit
    )
  }

  for (const module of MODULES) {
    const result =
      await initializeModule(
        module
      )

    if (!result.success) {
      return failBootstrap(
        "module-initialization-failed",
        {
          moduleId:
            module?.id ??
            "unknown",

          result,
        }
      )
    }

    const registration =
      boosterverseRuntimeOrchestrator
        .registerRuntimeModule({
          id:
            module.id,

          name:
            module.name,

          module,

          enabled: true,
        })

    if (
      !registration ||
      registration.success !== true
    ) {
      return failBootstrap(
        "runtime-registration-failed",
        {
          moduleId:
            module.id,

          registration,
        }
      )
    }

    bootstrapState.modules.push(
      module.id
    )
  }

  bootstrapState.initialized =
    true

  bootstrapState.initializedAt =
    new Date().toISOString()

  return {
    success: true,

    status:
      "initialized",

    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    modules:
      [...bootstrapState.modules],

    runtime:
      boosterverseRuntimeOrchestrator
        .getRuntimeSummary(),
  }
}


/**
 * Käynnistää Boosterverse-runtimen.
 */
async function startBoosterverseRuntime({
  tickIntervalMs = 1000,
  runInitialTick = true,
} = {}) {
  if (!bootstrapState.initialized) {
    const initialized =
      await initializeBoosterverseRuntime({
        tickIntervalMs,
      })

    if (
      !initialized ||
      initialized.success !== true
    ) {
      return initialized
    }
  }

  if (bootstrapState.started) {
    return {
      success: true,

      status:
        "already-running",

      runtime:
        boosterverseRuntimeOrchestrator
          .getRuntimeSummary(),
    }
  }

  if (runInitialTick) {
    const initialTick =
      await boosterverseRuntimeOrchestrator
        .runRuntimeTick()

    if (
      !initialTick ||
      initialTick.success !== true
    ) {
      return failBootstrap(
        "initial-runtime-tick-failed",
        initialTick
      )
    }
  }

  const started =
    boosterverseRuntimeOrchestrator
      .startRuntime()

  if (
    !started ||
    started.success !== true
  ) {
    return failBootstrap(
      "runtime-start-failed",
      started
    )
  }

  bootstrapState.started = true

  bootstrapState.startedAt =
    new Date().toISOString()

  return {
    success: true,

    status:
      "running",

    moduleId:
      MODULE_ID,

    runtime:
      boosterverseRuntimeOrchestrator
        .getRuntimeSummary(),
  }
}


/**
 * Pysäyttää Boosterverse-runtimen.
 */
function stopBoosterverseRuntime() {
  if (!bootstrapState.initialized) {
    return {
      success: true,

      status:
        "not-initialized",
    }
  }

  const result =
    boosterverseRuntimeOrchestrator
      .stopRuntime()

  bootstrapState.started =
    false

  return {
    success: true,

    status:
      "stopped",

    runtime:
      result,
  }
}


/**
 * Tekee yhden runtime-tickin käsin.
 *
 * Hyödyllinen testeihin ennen kuin
 * jatkuva runtime otetaan käyttöön.
 */
async function tickBoosterverseRuntime() {
  if (!bootstrapState.initialized) {
    const initialized =
      await initializeBoosterverseRuntime()

    if (
      !initialized ||
      initialized.success !== true
    ) {
      return initialized
    }
  }

  return boosterverseRuntimeOrchestrator
    .runRuntimeTick()
}


/**
 * Palauttaa Spacemonkeylle
 * koko yhdistetyn runtime-contextin.
 */
function getBoosterverseContext() {
  if (!bootstrapState.initialized) {
    return {
      available: false,

      reason:
        "boosterverse-not-initialized",
    }
  }

  return {
    available: true,

    context:
      boosterverseRuntimeOrchestrator
        .getSpacemonkeyRuntimeContext(),
  }
}


/**
 * Palauttaa bootstrapin tilan.
 */
function getBoosterverseBootstrapState() {
  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    initialized:
      bootstrapState.initialized,

    started:
      bootstrapState.started,

    initializedAt:
      bootstrapState.initializedAt,

    startedAt:
      bootstrapState.startedAt,

    modules:
      [...bootstrapState.modules],

    errors:
      [...bootstrapState.errors],

    runtime:
      bootstrapState.initialized
        ? boosterverseRuntimeOrchestrator
            .getRuntimeSummary()
        : null,
  }
}


/**
 * Health check.
 */
function getBoosterverseBootstrapHealth() {
  const runtimeHealth =
    bootstrapState.initialized
      ? boosterverseRuntimeOrchestrator
          .health()
      : null

  return {
    moduleId:
      MODULE_ID,

    version:
      MODULE_VERSION,

    healthy:
      bootstrapState.initialized &&
      (
        runtimeHealth?.healthy !==
        false
      ),

    status:
      bootstrapState.started
        ? "running"
        : bootstrapState.initialized
          ? "initialized"
          : "idle",

    modules:
      bootstrapState.modules.length,

    errors:
      bootstrapState.errors.length,

    runtime:
      runtimeHealth,
  }
}


/**
 * Alustaa yksittäisen moduulin.
 */
async function initializeModule(
  module
) {
  if (
    !module ||
    typeof module !== "object"
  ) {
    return {
      success: false,

      error:
        "invalid-module",
    }
  }

  if (
    typeof module.initialize !==
    "function"
  ) {
    return {
      success: true,

      status:
        "no-initialize-handler",
    }
  }

  try {
    const result =
      await module.initialize()

    if (
      result &&
      result.success === false
    ) {
      return result
    }

    return {
      success: true,

      result:
        result ?? null,
    }
  } catch (error) {
    return {
      success: false,

      error:
        error?.message ||
        "unknown-module-initialization-error",
    }
  }
}


/**
 * Bootstrap failure.
 */
function failBootstrap(
  reason,
  details = null
) {
  const error = {
    reason,

    details,

    timestamp:
      new Date().toISOString(),
  }

  bootstrapState.errors.push(
    error
  )

  return {
    success: false,

    status:
      "failed",

    moduleId:
      MODULE_ID,

    error,
  }
}


export {
  MODULE_ID,
  MODULE_VERSION,

  initializeBoosterverseRuntime,

  startBoosterverseRuntime,

  stopBoosterverseRuntime,

  tickBoosterverseRuntime,

  getBoosterverseContext,

  getBoosterverseBootstrapState,

  getBoosterverseBootstrapHealth,
}


export default {
  id:
    MODULE_ID,

  name:
    "Boosterverse Runtime Bootstrap",

  version:
    MODULE_VERSION,

  description:
    "Alustaa ja käynnistää Boosterversen moduulit yhtenä hallittuna Spacemonkey-runtimeympäristönä.",

  initialize:
    initializeBoosterverseRuntime,

  start:
    startBoosterverseRuntime,

  stop:
    stopBoosterverseRuntime,

  tick:
    tickBoosterverseRuntime,

  getContext:
    getBoosterverseContext,

  getState:
    getBoosterverseBootstrapState,

  health:
    getBoosterverseBootstrapHealth,
}
