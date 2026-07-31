/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MODULE REGISTRY

Vastuut:
- rekisteröi moduulit
- estää päällekkäiset moduulit
- palauttaa moduuleja
- poistaa moduuleja
- listaa aktiiviset moduulit
- tarjoaa rekisterin version ja tilatiedot

Tämä tiedosto ei:
- valitse moduulia
- suorita moduulia
- käsittele käyttäjän viestiä
- sisällä liiketoimintalogiikkaa
- kutsu kielimallia
=====================================
*/


import {
  getBrainVersionSummary,
} from "./system/brainVersion.js"

import {
  getBrainModuleSummary,
  normalizeModuleId,
  validateBrainModule,
} from "./moduleContract.js"


const MODULE_REGISTRY_VERSION =
  "2.0.0"


const moduleRegistry =
  new Map()


function registerBrainModule(
  moduleDefinition,
) {
  const validatedModule =
    validateBrainModule(
      moduleDefinition,
    )

  if (
    moduleRegistry.has(
      validatedModule.id,
    )
  ) {
    throw new Error(
      `AI Brain -moduuli "${validatedModule.id}" on jo rekisteröity.`,
    )
  }

  moduleRegistry.set(
    validatedModule.id,
    validatedModule,
  )

  return validatedModule
}


function replaceBrainModule(
  moduleDefinition,
) {
  const validatedModule =
    validateBrainModule(
      moduleDefinition,
    )

  moduleRegistry.set(
    validatedModule.id,
    validatedModule,
  )

  return validatedModule
}


function unregisterBrainModule(
  moduleId,
) {
  const normalizedId =
    normalizeModuleId(
      moduleId,
    )

  if (!normalizedId) {
    return false
  }

  return moduleRegistry.delete(
    normalizedId,
  )
}


function getBrainModule(
  moduleId,
) {
  const normalizedId =
    normalizeModuleId(
      moduleId,
    )

  if (!normalizedId) {
    return null
  }

  return (
    moduleRegistry.get(
      normalizedId,
    ) ||
    null
  )
}


function hasBrainModule(
  moduleId,
) {
  const normalizedId =
    normalizeModuleId(
      moduleId,
    )

  if (!normalizedId) {
    return false
  }

  return moduleRegistry.has(
    normalizedId,
  )
}


function getRegisteredBrainModules({
  includeDisabled = false,
} = {}) {
  return Array.from(
    moduleRegistry.values(),
  )
    .filter(
      (
        moduleDefinition,
      ) => {
        if (includeDisabled) {
          return true
        }

        return (
          moduleDefinition.enabled !==
          false
        )
      },
    )
    .sort(
      (
        firstModule,
        secondModule,
      ) => {
        return (
          firstModule.priority -
          secondModule.priority
        )
      },
    )
}


function getRegisteredBrainModuleInfo({
  includeDisabled = false,
} = {}) {
  return getRegisteredBrainModules({
    includeDisabled,
  }).map(
    getBrainModuleSummary,
  )
}


function clearBrainModuleRegistry() {
  moduleRegistry.clear()
}


function getBrainModuleCount({
  includeDisabled = false,
} = {}) {
  return getRegisteredBrainModules({
    includeDisabled,
  }).length
}


function getBrainModuleRegistryMetadata() {
  const brainVersion =
    getBrainVersionSummary()

  const totalModules =
    getBrainModuleCount({
      includeDisabled:
        true,
    })

  const activeModules =
    getBrainModuleCount({
      includeDisabled:
        false,
    })

  return {
    id:
      "wood-booster-ai-brain-module-registry",

    name:
      "AI Brain Module Registry",

    registryVersion:
      MODULE_REGISTRY_VERSION,

    brainVersion:
      brainVersion.version,

    brainVersionLabel:
      brainVersion.label,

    brainCodename:
      brainVersion.codename,

    moduleSystem:
      "v2",

    totalModules,

    activeModules,

    disabledModules:
      totalModules -
      activeModules,

    empty:
      totalModules ===
      0,
  }
}


function getBrainModuleRegistrySnapshot({
  includeDisabled = true,
} = {}) {
  return {
    metadata:
      getBrainModuleRegistryMetadata(),

    modules:
      getRegisteredBrainModuleInfo({
        includeDisabled,
      }),
  }
}


export {
  MODULE_REGISTRY_VERSION,
  clearBrainModuleRegistry,
  getBrainModule,
  getBrainModuleCount,
  getBrainModuleRegistryMetadata,
  getBrainModuleRegistrySnapshot,
  getRegisteredBrainModuleInfo,
  getRegisteredBrainModules,
  hasBrainModule,
  registerBrainModule,
  replaceBrainModule,
  unregisterBrainModule,
}
