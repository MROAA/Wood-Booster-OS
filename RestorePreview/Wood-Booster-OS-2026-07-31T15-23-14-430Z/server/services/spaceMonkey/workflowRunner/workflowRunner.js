import {
  findModuleById,
  startModuleManager,
} from "../moduleManager/moduleManager.js"


let moduleManagerStarted = false


function ensureModuleManagerStarted() {
  if (moduleManagerStarted) {
    return
  }

  startModuleManager()

  moduleManagerStarted = true
}


function runSpaceMonkeyWorkflow({
  goal,
} = {}) {
  ensureModuleManagerStarted()

  const workflowModule =
    findModuleById(
      "workflow",
    )

  const plannerModule =
    findModuleById(
      "planner",
    )

  const taskModule =
    findModuleById(
      "task",
    )

  const executionModule =
    findModuleById(
      "execution",
    )

  if (
    !workflowModule ||
    typeof workflowModule.runWorkflow !==
      "function"
  ) {
    return {
      success: false,
      status: "workflow-unavailable",
      moduleId: "workflow-runner",
      goal:
        String(goal || "").trim() ||
        null,
      result: null,
    }
  }

  const result =
    workflowModule.runWorkflow({
      goal,
      plannerModule,
      taskModule,
      executionModule,
    })

  return {
    success:
      result?.success === true,
    status:
      result?.success
        ? "workflow-runner-completed"
        : "workflow-runner-failed",
    moduleId: "workflow-runner",
    goal:
      String(goal || "").trim() ||
      null,
    result,
  }
}


export {
  runSpaceMonkeyWorkflow,
}
