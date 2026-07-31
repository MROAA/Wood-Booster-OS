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


const plan =
  plannerModule?.createPlan({
    goal:
      "Create a new Wood-Booster project",
  })


const validTaskResult =
  taskModule?.createTasksFromPlan({
    plan,
  })


const invalidTaskResult =
  taskModule?.createTasksFromPlan({
    plan: null,
  })


const emptyTaskResult =
  taskModule?.createTasksFromPlan({
    plan: {
      goal:
        "Empty plan test",
      steps: [],
    },
  })


console.log(
  "\nSOURCE PLAN\n",
)

console.dir(
  plan,
  {
    depth: null,
  },
)


console.log(
  "\nVALID TASK RESULT\n",
)

console.dir(
  validTaskResult,
  {
    depth: null,
  },
)


console.log(
  "\nINVALID TASK RESULT\n",
)

console.dir(
  invalidTaskResult,
  {
    depth: null,
  },
)


console.log(
  "\nEMPTY TASK RESULT\n",
)

console.dir(
  emptyTaskResult,
  {
    depth: null,
  },
)
