import {
  startRuntime,
} from "./runtime/runtime.js"

import {
  findModuleById,
  startModuleManager,
} from "./moduleManager/moduleManager.js"

import {
  runSpaceMonkeyWorkflow,
} from "./workflowRunner/workflowRunner.js"


function startSpaceMonkey() {
  return startRuntime()
}


function runWorkflow({
  goal,
} = {}) {
  return runSpaceMonkeyWorkflow({
    goal,
  })
}


function decideModule({
  goal,
} = {}) {
  startModuleManager()

  const decisionModule =
    findModuleById(
      "decision",
    )

  if (
    !decisionModule ||
    typeof decisionModule.chooseModule !==
      "function"
  ) {
    return {
      success: false,
      status:
        "decision-module-unavailable",
      moduleId: "space-monkey-api",
      selectedModuleId: null,
      reason:
        "Decision module is unavailable.",
    }
  }

  return decisionModule.chooseModule({
    goal,
  })
}


export {
  startSpaceMonkey,
  runWorkflow,
  decideModule,
}
