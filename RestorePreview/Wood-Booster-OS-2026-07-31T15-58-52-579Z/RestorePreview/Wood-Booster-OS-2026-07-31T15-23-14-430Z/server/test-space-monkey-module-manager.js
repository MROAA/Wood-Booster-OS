import {
  findModuleById,
  hasModule,
  startModuleManager,
} from "./services/spaceMonkey/moduleManager/moduleManager.js"


const managerResult =
  startModuleManager()


const memoryModule =
  findModuleById(
    "memory",
  )


const knowledgeExists =
  hasModule(
    "knowledge",
  )


const plannerExists =
  hasModule(
    "planner",
  )


console.log(
  "\nMODULE MANAGER\n",
)

console.dir(
  managerResult,
  {
    depth: null,
  },
)


console.log(
  "\nMEMORY MODULE\n",
)

console.dir(
  memoryModule,
  {
    depth: null,
  },
)


console.log(
  "\nMODULE LOOKUP\n",
)

console.dir(
  {
    knowledgeExists,
    plannerExists,
  },
  {
    depth: null,
  },
)
