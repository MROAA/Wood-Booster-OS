import {
  createStrategy,
  updateStrategyStatus,
  addStrategyStep,
  getStrategies,
  getActiveStrategies,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE STRATEGY ENGINE ==="
)



const strategy =
  createStrategy({

    goalId:
      "goal-build-ai-os",


    objective:
      "Build secure modular AI operating system.",


    steps:

      [
        "Complete Creator Intelligence.",
        "Connect AI Brain.",
        "Develop Operator Layer.",
      ],


    priorities:

      [
        "Security",
        "Modularity",
        "Stability",
      ],


    resources:

      [
        "AI Brain",
        "Knowledge Vault",
        "Developer Environment",
      ],


    timeline:
      "Long-term",

  })



console.log(
  "\n=== STRATEGY ==="
)



console.log(
  strategy
)



console.log(
  "\n=== ADD STEP ==="
)



console.log(
  addStrategyStep({

    id:
      strategy.id,


    step:
      "Create security testing framework.",

  })
)



console.log(
  "\n=== UPDATE ==="
)



console.log(
  updateStrategyStatus({

    id:
      strategy.id,


    status:
      "active",

  })
)



console.log(
  "\n=== ALL STRATEGIES ==="
)



console.log(
  getStrategies()
)



console.log(
  "\n=== ACTIVE ==="
)



console.log(
  getActiveStrategies()
)
