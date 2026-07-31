import {
  findModuleById,
  startModuleManager,
} from "./services/spaceMonkey/moduleManager/moduleManager.js"


startModuleManager()


const plannerModule =
  findModuleById(
    "planner",
  )


const validPlan =
  plannerModule?.createPlan({
    goal:
      "Create a new Wood-Booster project",
  })


const invalidPlan =
  plannerModule?.createPlan({
    goal: "",
  })


console.log(
  "\nPLANNER MODULE\n",
)

console.dir(
  plannerModule,
  {
    depth: null,
  },
)


console.log(
  "\nVALID PLAN\n",
)

console.dir(
  validPlan,
  {
    depth: null,
  },
)


console.log(
  "\nINVALID PLAN\n",
)

console.dir(
  invalidPlan,
  {
    depth: null,
  },
)
