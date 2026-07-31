import {
  routeAction,
  validateAction,
  createExecutionRequest,
  getActions,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE ACTION ROUTER ==="
)



const action =
  routeAction({

    task:
      "Analyze project architecture.",


    requiredCapability:
      "analysis",


    agent:
      "planner-agent",


    tool:
      "knowledge-engine",


    riskLevel:
      "medium",

  })



console.log(
  "\n=== ACTION ==="
)



console.log(
  action
)



console.log(
  "\n=== VALIDATION ==="
)



console.log(
  validateAction(
    action
  )
)



console.log(
  "\n=== EXECUTION REQUEST ==="
)



console.log(
  createExecutionRequest(
    action
  )
)



console.log(
  "\n=== HISTORY ==="
)



console.log(
  getActions()
)
