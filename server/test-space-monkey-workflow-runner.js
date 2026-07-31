import {
  runSpaceMonkeyWorkflow,
} from "./services/spaceMonkey/workflowRunner/workflowRunner.js"


const validResult =
  runSpaceMonkeyWorkflow({
    goal:
      "Create a new Wood-Booster project",
  })


const invalidResult =
  runSpaceMonkeyWorkflow({
    goal: "",
  })


console.log(
  "\nVALID WORKFLOW RUNNER RESULT\n",
)

console.dir(
  validResult,
  {
    depth: null,
  },
)


console.log(
  "\nINVALID WORKFLOW RUNNER RESULT\n",
)

console.dir(
  invalidResult,
  {
    depth: null,
  },
)
