import {
  updateCreatorContext,
  getCreatorContext,
  getIdentityContext,
  getPhilosophyContext,
  getDecisionContext,
  getVisionContext,
  getPatternContext,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR CONTEXT PROVIDER ==="
)



updateCreatorContext({

  identity:

    {
      name:
        "Marc Järvinen",

      role:
        "Creator and architect",

    },


  philosophy:

    [
      "Build modular systems.",
      "Protect stable foundations.",
    ],


  decisions:

    [
      "Use isolated MVP modules.",
    ],


  vision:

    [
      "Create sustainable intelligent systems.",
    ],


  patterns:

    [
      "Incremental development.",
      "Long-term thinking.",
    ],

})



console.log(
  "\n=== FULL CONTEXT ==="
)



console.log(
  getCreatorContext()
)



console.log(
  "\n=== IDENTITY ==="
)



console.log(
  getIdentityContext()
)



console.log(
  "\n=== PHILOSOPHY ==="
)



console.log(
  getPhilosophyContext()
)



console.log(
  "\n=== DECISIONS ==="
)



console.log(
  getDecisionContext()
)



console.log(
  "\n=== VISION ==="
)



console.log(
  getVisionContext()
)



console.log(
  "\n=== PATTERNS ==="
)



console.log(
  getPatternContext()
)
