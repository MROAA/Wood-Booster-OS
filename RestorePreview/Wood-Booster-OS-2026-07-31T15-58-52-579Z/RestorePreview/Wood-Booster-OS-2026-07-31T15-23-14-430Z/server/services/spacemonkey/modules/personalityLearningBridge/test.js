import {
  analyzePersonalityEvent,
  getLearningProposals,
  getLatestProposals,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY LEARNING BRIDGE ==="
)



console.log(
  analyzePersonalityEvent({

    type:
      "humor-used",

    source:
      "humor-personality",

    context:

      {
        userReaction:
          "positive",

      },

  })
)



console.log(
  analyzePersonalityEvent({

    type:
      "rule-applied",

    source:
      "personality-rule-registry",

    context:

      {
        rule:
          "friendly-character",

      },

  })
)



console.log(
  "\n=== LEARNING PROPOSALS ==="
)



console.log(
  getLearningProposals()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestProposals()
)
