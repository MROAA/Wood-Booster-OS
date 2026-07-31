import {
  createCreatorSummary,
  getCreatorSummaries,
  getLatestSummary,
  extractCorePrinciples,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE SUMMARY ==="
)



const summary =
  createCreatorSummary({

    identity:

      {
        name:
          "Marc Järvinen",

        role:
          "Creator of Wood-Booster OS",

      },


    philosophy:

      [
        "Build modular systems.",
        "Protect stable foundations.",
        "Respect nature and materials.",
      ],


    decisions:

      [
        "Do not modify stable core without reason.",
      ],


    journal:

      [
        "Develop Spacemonkey step by step.",
      ],


    knowledge:

      [
        "Wood-Booster OS architecture.",
      ],


    patterns:

      [
        "Modular development preference.",
      ],

  })



console.log(
  summary
)



console.log(
  "\n=== ALL SUMMARIES ==="
)



console.log(
  getCreatorSummaries()
)



console.log(
  "\n=== LATEST SUMMARY ==="
)



console.log(
  getLatestSummary()
)



console.log(
  "\n=== CORE PRINCIPLES ==="
)



console.log(
  extractCorePrinciples(
    summary
  )
)
