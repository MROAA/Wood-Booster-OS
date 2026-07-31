import {
  getModules,
  getModuleIds,
} from "../modules/moduleRegistry.js"

import {
  registerSpaceMonkeyModules,
} from "../modules/registerModules.js"

import {
  runLifecycle,
} from "../lifecycle/lifecycleManager.js"


function findModuleById(
  moduleId,
) {
  if (!moduleId) {
    return null
  }

  const modules =
    getModules()

  return (
    modules.find(
      (moduleDefinition) =>
        moduleDefinition.id === moduleId,
    ) || null
  )
}


function hasModule(
  moduleId,
) {
  return Boolean(
    findModuleById(
      moduleId,
    ),
  )
}


function startModuleManager() {
  registerSpaceMonkeyModules()

  const modules =
    getModules()

  const moduleIds =
    getModuleIds()

  const lifecycle =
    runLifecycle({
      modules,
    })

  return {
    success: true,
    status: "running",
    modules,
    moduleIds,
    lifecycle,
  }
}


export {
  findModuleById,
  hasModule,
  startModuleManager,
}
