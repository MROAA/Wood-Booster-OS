import {
  initializeModules,
} from "../modules/initializeModules.js"

import {
  startModules,
} from "../modules/startModules.js"

import {
  checkModulesHealth,
} from "../modules/checkModuleHealth.js"


function runLifecycle({
  modules = [],
} = {}) {
  const initializationResults =
    initializeModules(
      modules,
    )

  const startResults =
    startModules(
      modules,
    )

  const healthResults =
    checkModulesHealth(
      modules,
    )

  return {
    initializationResults,
    startResults,
    healthResults,
  }
}


export {
  runLifecycle,
}
