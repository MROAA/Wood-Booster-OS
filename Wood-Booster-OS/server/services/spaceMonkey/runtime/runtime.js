import {
  startModuleManager,
} from "../moduleManager/moduleManager.js"


function createRuntimeStatus({
  status = "running",
  moduleManager = {},
} = {}) {
  return {
    name: "SpaceMonkey Runtime",
    status,
    moduleManager,
  }
}


function startRuntime() {
  const moduleManager =
    startModuleManager()

  return createRuntimeStatus({
    status: "running",
    moduleManager,
  })
}


export {
  createRuntimeStatus,
  startRuntime,
}
