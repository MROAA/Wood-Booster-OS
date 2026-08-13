import {
  createExecutionPlan,
  addTask,
  updatePlanStatus,
  getPlans,
  getActivePlans,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE EXECUTION PLANNER ==="
)



const plan =
  createExecutionPlan({

    strategyId:
      "strategy-ai-os",


    objective:
      "Build secure modular AI operating system.",


    tasks:

      [
        "Complete Creator Layer.",
        "Connect AI Brain.",
        "Test security modules.",
      ],


    dependencies:

      [
        "Knowledge Vault",
        "Governance Engine",
      ],


    tools:

      [
        "Node.js",
        "Database",
        "AI Runtime",
      ],


    validationPoints:

      [
        "Security review.",
        "Health check.",
      ],

  })



console.log(
  "\n=== PLAN ==="
)



console.log(
  plan
)



console.log(
  "\n=== ADD TASK ==="
)



console.log(
  addTask({

    planId:
      plan.id,


    task:
      "Create operator dashboard.",

  })
)



console.log(
  "\n=== STATUS UPDATE ==="
)



console.log(
  updatePlanStatus({

    id:
      plan.id,


    status:
      "active",

  })
)



console.log(
  "\n=== ALL PLANS ==="
)



console.log(
  getPlans()
)



console.log(
  "\n=== ACTIVE PLANS ==="
)



console.log(
  getActivePlans()
)
