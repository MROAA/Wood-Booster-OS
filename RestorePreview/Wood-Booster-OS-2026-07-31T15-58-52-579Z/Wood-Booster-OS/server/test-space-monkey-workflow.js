import {
  findModuleById,
  startModuleManager,
} from "./services/spaceMonkey/moduleManager/moduleManager.js"


startModuleManager()


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


const workflowModule =
  findModuleById(
    "workflow",
  )


const validWorkflowResult =
  workflowModule?.runWorkflow({
    goal:
      "Create a new Wood-Booster project",
    plannerModule,
    taskModule,
    executionModule,
  })


const invalidGoalResult =
  workflowModule?.runWorkflow({
    goal: "",
    plannerModule,
    taskModule,
    executionModule,
  })


const missingPlannerResult =
  workflowModule?.runWorkflow({
    goal:
      "Test missing planner",
    plannerModule: null,
    taskModule,
    executionModule,
  })


console.log(
  "\nWORKFLOW MODULE\n",
)

console.dir(
  workflowModule,
  {
    depth: null,
  },
)


console.log(
  "\nVALID WORKFLOW RESULT\n",
)

console.dir(
  validWorkflowResult,
  {
    depth: null,
  },
)


console.log(
  "\nINVALID GOAL RESULT\n",
)

console.dir(
  invalidGoalResult,
  {
    depth: null,
  },
)


console.log(
  "\nMISSING PLANNER RESULT\n",
)

console.dir(
  missingPlannerResult,
  {
    depth: null,
  },
)
