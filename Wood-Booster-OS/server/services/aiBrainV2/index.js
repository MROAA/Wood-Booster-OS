/*
=====================================
WOOD-BOOSTER AI BRAIN V2

PUBLIC API

Tämän tiedoston kautta muu järjestelmä
käyttää AI Brain v2.0:aa.

Muiden tiedostojen ei tarvitse tietää,
miten runtime, registry tai router
toimivat sisäisesti.
=====================================
*/


import {
  runBrainRuntime,
} from "./brainRuntime.js"

import {
  clearBrainModuleRegistry,
  getBrainModule,
  getBrainModuleCount,
  getRegisteredBrainModuleInfo,
  getRegisteredBrainModules,
  hasBrainModule,
  registerBrainModule,
  replaceBrainModule,
  unregisterBrainModule,
} from "./moduleRegistry.js"

import {
  registerDefaultBrainModules,
} from "./registerDefaultModules.js"


function ensureDefaultBrainModules() {
  return registerDefaultBrainModules()
}


async function runBrain({
  message,
  source,
  runtimeContext = {},
} = {}) {
  ensureDefaultBrainModules()

  return runBrainRuntime({
    message,
    source,
    runtimeContext,
  })
}


function clearBrainModules() {
  clearBrainModuleRegistry()
}


function getBrainModuleInfo(
  options = {},
) {
  return getRegisteredBrainModuleInfo(
    options,
  )
}


function getBrainModules() {
  return getRegisteredBrainModules()
}


export {
  clearBrainModules,
  ensureDefaultBrainModules,
  getBrainModule,
  getBrainModuleCount,
  getBrainModuleInfo,
  getBrainModules,
  getRegisteredBrainModules,
  hasBrainModule,
  registerBrainModule,
  registerDefaultBrainModules,
  replaceBrainModule,
  runBrain,
  unregisterBrainModule,
}
