/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * Public API
 *
 * Kaikki Boosterverse-moduulit importtaavat SDK:n tämän
 * tiedoston kautta.
 *
 * Esimerkki:
 *
 * import {
 *   Runtime,
 *   createModule,
 *   EventTypes,
 * } from "../sdk/index.js"
 */

/*
 * ============================================================
 * Core
 * ============================================================
 */

export {
  default as BaseModule,
} from "./core/BaseModule.js"

export {
  default as BaseEngine,
} from "./core/BaseEngine.js"

export {
  default as ModuleRegistry,
} from "./core/ModuleRegistry.js"

export {
  default as RuntimeContext,
} from "./core/RuntimeContext.js"

export {
  default as Runtime,
} from "./core/Runtime.js"

export {
  createModule,
  createEngine,
  createModuleDefinition,

  isBoosterverseModule,
  isBoosterverseEngine,

  validateModule,
  cloneModuleMetadata,
} from "./core/ModuleFactory.js"

/*
 * ============================================================
 * Events
 * ============================================================
 */

export {
  default as EventBus,
} from "./events/EventBus.js"

export {
  EventTypes,
  default as EventTypesDefault,
} from "./events/EventTypes.js"

/*
 * ============================================================
 * State
 * ============================================================
 */

export {
  default as StateStore,
} from "./state/StateStore.js"

export {
  default as SnapshotStore,
} from "./state/SnapshotStore.js"

export {
  default as HistoryStore,
} from "./state/HistoryStore.js"

/*
 * ============================================================
 * Logging
 * ============================================================
 */

export {
  default as Logger,
  LOG_LEVELS,
  LEVEL_PRIORITY,
} from "./logging/Logger.js"

/*
 * ============================================================
 * SDK Metadata
 * ============================================================
 */

export const SDK_NAME =
  "Boosterverse SDK"

export const SDK_VERSION =
  "1.0.0"

export const SDK_AUTHOR =
  "Wood-Booster HQ"

export const SDK_BUILD =
  "development"

export function sdkInfo() {
  return {
    name:
      SDK_NAME,

    version:
      SDK_VERSION,

    build:
      SDK_BUILD,

    author:
      SDK_AUTHOR,
  }
}

export default {
  SDK_NAME,
  SDK_VERSION,
  SDK_BUILD,

  sdkInfo,
}
