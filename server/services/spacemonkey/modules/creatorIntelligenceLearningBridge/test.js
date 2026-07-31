import {
  createLearningEvent,
  processReflection,
  getLearningEvents,
  getLatestLearning,
  exportKnowledgeUpdate,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE LEARNING BRIDGE ==="
)



console.log(
  createLearningEvent({

    source:
      "creator-reflection-engine",


    category:
      "architecture",


    lesson:
      "Modular systems are easier to evolve safely.",


    impact:
      "Continue isolated MVP development.",

  })
)



console.log(
  "\n=== PROCESS REFLECTION ==="
)



console.log(
  processReflection({

    source:
      "reflection-engine",


    lesson:
      "Protect stable foundations.",


    recommendation:
      "Avoid unnecessary core changes.",

  })
)



console.log(
  "\n=== LEARNING EVENTS ==="
)



console.log(
  getLearningEvents()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestLearning()
)



console.log(
  "\n=== KNOWLEDGE UPDATE ==="
)



console.log(
  exportKnowledgeUpdate()
)
