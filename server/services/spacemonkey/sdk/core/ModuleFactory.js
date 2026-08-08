/**
 * Wood-Booster HQ
 * Boosterverse SDK
 *
 * ModuleFactory
 *
 * Tarkoitus:
 * - tehdä uusien moduulien luomisesta nopeaa
 * - vähentää boilerplate-koodia
 * - tarjota yhtenäinen createModule()-rajapinta
 * - tukea BaseModule- ja BaseEngine-pohjia
 */

import BaseModule from "./BaseModule.js"
import BaseEngine from "./BaseEngine.js"


function createModule({
  id,
  name = null,
  version = "1.0.0",
  description = null,
  enabled = true,
  dependencies = [],
  metadata = null,

  initialize = null,
  start = null,
  update = null,
  stop = null,
  context = null,
  health = null,
  snapshot = null,
  reset = null,
} = {}) {
  validateId(id)

  class FactoryModule extends BaseModule {
    constructor() {
      super({
        id,
        name,
        version,
        description,
        enabled,
        dependencies,
        metadata,
      })
    }

    async onInitialize(runtime) {
      if (
        typeof initialize !==
        "function"
      ) {
        return null
      }

      return initialize(
        runtime,
        this
      )
    }

    async onStart(runtime) {
      if (
        typeof start !==
        "function"
      ) {
        return null
      }

      return start(
        runtime,
        this
      )
    }

    async onUpdate(
      runtime,
      runtimeContext
    ) {
      if (
        typeof update !==
        "function"
      ) {
        return null
      }

      return update(
        runtime,
        runtimeContext,
        this
      )
    }

    async onStop(runtime) {
      if (
        typeof stop !==
        "function"
      ) {
        return null
      }

      return stop(
        runtime,
        this
      )
    }

    async onContext(runtime) {
      if (
        typeof context !==
        "function"
      ) {
        return null
      }

      return context(
        runtime,
        this
      )
    }

    async onHealth(runtime) {
      if (
        typeof health !==
        "function"
      ) {
        return null
      }

      return health(
        runtime,
        this
      )
    }

    async onSnapshot(runtime) {
      if (
        typeof snapshot !==
        "function"
      ) {
        return null
      }

      return snapshot(
        runtime,
        this
      )
    }

    async onReset(runtime) {
      if (
        typeof reset !==
        "function"
      ) {
        return null
      }

      return reset(
        runtime,
        this
      )
    }
  }

  return new FactoryModule()
}


function createEngine({
  id,
  name = null,
  version = "1.0.0",
  description = null,
  enabled = true,
  dependencies = [],
  metadata = null,

  confidenceThreshold = 0.5,

  initialize = null,
  start = null,
  update = null,
  stop = null,

  evaluate = null,

  context = null,
  health = null,
  snapshot = null,
  reset = null,
} = {}) {
  validateId(id)

  class FactoryEngine extends BaseEngine {
    constructor() {
      super({
        id,
        name,
        version,
        description,
        enabled,
        dependencies,
        metadata,
        confidenceThreshold,
      })
    }

    async onInitialize(runtime) {
      if (
        typeof initialize !==
        "function"
      ) {
        return null
      }

      return initialize(
        runtime,
        this
      )
    }

    async onStart(runtime) {
      if (
        typeof start !==
        "function"
      ) {
        return null
      }

      return start(
        runtime,
        this
      )
    }

    async onUpdate(
      runtime,
      runtimeContext
    ) {
      if (
        typeof update !==
        "function"
      ) {
        return null
      }

      return update(
        runtime,
        runtimeContext,
        this
      )
    }

    async onStop(runtime) {
      if (
        typeof stop !==
        "function"
      ) {
        return null
      }

      return stop(
        runtime,
        this
      )
    }

    async onEvaluate(
      input,
      evaluationContext,
      runtime
    ) {
      if (
        typeof evaluate !==
        "function"
      ) {
        return {
          confidence: 0,
          result: null,
          reason:
            "No evaluate handler configured",
        }
      }

      return evaluate(
        input,
        evaluationContext,
        runtime,
        this
      )
    }

    async onContext(runtime) {
      const baseContext =
        await super.onContext(
          runtime
        )

      if (
        typeof context !==
        "function"
      ) {
        return baseContext
      }

      const customContext =
        await context(
          runtime,
          this
        )

      if (
        !customContext ||
        typeof customContext !==
        "object"
      ) {
        return baseContext
      }

      return {
        ...baseContext,
        ...customContext,
      }
    }

    async onHealth(runtime) {
      const baseHealth =
        await super.onHealth(
          runtime
        )

      if (
        typeof health !==
        "function"
      ) {
        return baseHealth
      }

      const customHealth =
        await health(
          runtime,
          this
        )

      if (
        !customHealth ||
        typeof customHealth !==
        "object"
      ) {
        return baseHealth
      }

      return {
        ...baseHealth,
        ...customHealth,
      }
    }

    async onSnapshot(runtime) {
      const baseSnapshot =
        await super.onSnapshot(
          runtime
        )

      if (
        typeof snapshot !==
        "function"
      ) {
        return baseSnapshot
      }

      const customSnapshot =
        await snapshot(
          runtime,
          this
        )

      if (
        !customSnapshot ||
        typeof customSnapshot !==
        "object"
      ) {
        return baseSnapshot
      }

      return {
        ...baseSnapshot,
        ...customSnapshot,
      }
    }

    async onReset(runtime) {
      await super.onReset(
        runtime
      )

      if (
        typeof reset !==
        "function"
      ) {
        return null
      }

      return reset(
        runtime,
        this
      )
    }
  }

  return new FactoryEngine()
}


function createModuleDefinition({
  id,
  name = null,
  version = "1.0.0",
  description = null,
  dependencies = [],
  type = "module",
  enabled = true,
  metadata = null,
} = {}) {
  validateId(id)

  const safeType =
    type === "engine"
      ? "engine"
      : "module"

  return Object.freeze({
    id:
      sanitizeString(id),

    name:
      sanitizeString(name) ||
      sanitizeString(id),

    version:
      sanitizeString(version) ||
      "1.0.0",

    description:
      sanitizeString(
        description
      ),

    dependencies:
      normalizeStrings(
        dependencies
      ),

    type:
      safeType,

    enabled:
      Boolean(enabled),

    metadata:
      cloneSafe(metadata),
  })
}


function isBoosterverseModule(
  value
) {
  return Boolean(
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.initialize ===
      "function" &&
    typeof value.health ===
      "function"
  )
}


function isBoosterverseEngine(
  value
) {
  return (
    isBoosterverseModule(
      value
    ) &&
    typeof value.evaluate ===
      "function"
  )
}


function validateModule(
  module
) {
  if (
    !module ||
    typeof module !== "object"
  ) {
    return {
      valid: false,
      errors: [
        "Module must be an object",
      ],
    }
  }

  const errors = []

  if (
    !sanitizeString(
      module.id
    )
  ) {
    errors.push(
      "Module id is required"
    )
  }

  if (
    typeof module.initialize !==
    "function"
  ) {
    errors.push(
      "Module initialize() is required"
    )
  }

  if (
    typeof module.health !==
    "function"
  ) {
    errors.push(
      "Module health() is required"
    )
  }

  if (
    module.dependencies !==
      undefined &&
    !Array.isArray(
      module.dependencies
    )
  ) {
    errors.push(
      "Module dependencies must be an array"
    )
  }

  return {
    valid:
      errors.length === 0,

    errors,
  }
}


function cloneModuleMetadata(
  module
) {
  if (
    !module ||
    typeof module !== "object"
  ) {
    return null
  }

  return {
    id:
      sanitizeString(
        module.id
      ),

    name:
      sanitizeString(
        module.name
      ),

    version:
      sanitizeString(
        module.version
      ),

    description:
      sanitizeString(
        module.description
      ),

    enabled:
      module.enabled !== false,

    status:
      module.status ??
      null,

    dependencies:
      normalizeStrings(
        module.dependencies
      ),

    metadata:
      cloneSafe(
        module.metadata
      ),
  }
}


function validateId(id) {
  const safe =
    sanitizeString(id)

  if (!safe) {
    throw new TypeError(
      "Module id is required"
    )
  }

  if (
    !/^[a-zA-Z0-9._-]+$/.test(
      safe
    )
  ) {
    throw new TypeError(
      "Module id may contain only letters, numbers, dots, underscores and hyphens"
    )
  }
}


function normalizeStrings(
  values
) {
  const array =
    Array.isArray(values)
      ? values
      : values === null ||
          values === undefined
        ? []
        : [values]

  return [
    ...new Set(
      array
        .map(
          sanitizeString
        )
        .filter(Boolean)
    ),
  ]
}


function sanitizeString(
  value
) {
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


function cloneSafe(
  value
) {
  if (
    value === undefined
  ) {
    return null
  }

  try {
    return JSON.parse(
      JSON.stringify(
        value
      )
    )
  } catch {
    return null
  }
}


export {
  createModule,
  createEngine,
  createModuleDefinition,

  isBoosterverseModule,
  isBoosterverseEngine,

  validateModule,
  cloneModuleMetadata,
}


export default {
  createModule,
  createEngine,
  createModuleDefinition,

  isBoosterverseModule,
  isBoosterverseEngine,

  validateModule,
  cloneModuleMetadata,
}
