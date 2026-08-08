import {
  createGoal,
  updateProgress,
  addMilestone,
  getGoals,
  getActiveGoals,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE GOAL ENGINE ==="
)



const goal =
  createGoal({

    title:
      "Build sustainable AI operating system.",


    description:
      "Develop Wood-Booster HQ with modular intelligence.",


    priority:
      "high",


    milestones:

      [
        "Complete Creator Layer.",
        "Connect AI Brain.",
        "Build secure tools.",
      ],

  })



console.log(
  "\n=== GOAL ==="
)



console.log(
  goal
)



console.log(
  "\n=== PROGRESS ==="
)



console.log(
  updateProgress({

    id:
      goal.id,


    progress:
      25,

  })
)



console.log(
  "\n=== ADD MILESTONE ==="
)



console.log(
  addMilestone({

    id:
      goal.id,


    milestone:
      "Create Operator Interface.",

  })
)



console.log(
  "\n=== ALL GOALS ==="
)



console.log(
  getGoals()
)



console.log(
  "\n=== ACTIVE ==="
)



console.log(
  getActiveGoals()
)
