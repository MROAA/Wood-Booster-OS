import {
  startSpaceMonkey,
  runWorkflow,
} from "./services/spaceMonkey/index.js"


const runtime =
  startSpaceMonkey()

console.log(
  "\nSPACE MONKEY RUNTIME\n",
)

console.dir(
  runtime,
  {
    depth: null,
  },
)


const workflow =
  runWorkflow({
    goal:
      "Create a new Wood-Booster project",
  })

console.log(
  "\nSPACE MONKEY WORKFLOW\n",
)

console.dir(
  workflow,
  {
    depth: null,
  },
)
