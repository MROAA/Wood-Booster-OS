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


const plan =
  plannerModule?.createPlan({
    goal:
      "Create a new Wood-Booster project",
  })


const taskResult =
  taskModule?.createTasksFromPlan({
    plan,
  })


const executionResult =
  executionModule?.executeTasks({
    tasks:
      taskResult?.tasks,
  })


const invalidExecutionResult =
  executionModule?.executeTasks({
    tasks: null,
  })


const emptyExecutionResult =
  executionModule?.executeTasks({
    tasks: [],
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
  "\nTASK RESULT\n",
)

console.dir(
  taskResult,
  {
    depth: null,
  },
)


console.log(
  "\nEXECUTION RESULT\n",
)

console.dir(
  executionResult,
  {
    depth: null,
  },
)


console.log(
  "\nINVALID EXECUTION RESULT\n",
)

console.dir(
  invalidExecutionResult,
  {
    depth: null,
  },
)


console.log(
  "\nEMPTY EXECUTION RESULT\n",
)

console.dir(
  emptyExecutionResult,
  {
    depth: null,
  },
)
