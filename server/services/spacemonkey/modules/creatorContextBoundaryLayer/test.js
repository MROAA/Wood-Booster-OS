import {
  classifyData,
  sanitizeContext,
  minimizeContext,
  recordBoundaryEvent,
  getBoundaryEvents,
  getClassifications,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR CONTEXT BOUNDARY LAYER ==="
)



console.log(
  getClassifications()
)



const context = {

  creator:
    "Marc Järvinen",

  principle:
    "Build modular systems.",

  system:
    "Wood-Booster HQ",

}



console.log(
  "\n=== CLASSIFICATION ==="
)



console.log(
  classifyData(
    context
  )
)



console.log(
  "\n=== SANITIZED ==="
)



console.log(
  sanitizeContext(
    context
  )
)



console.log(
  "\n=== MINIMIZED ==="
)



console.log(
  minimizeContext({

    context,

    requiredFields:

      [
        "principle",
      ],

  })
)



console.log(
  "\n=== EVENT ==="
)



console.log(
  recordBoundaryEvent({

    action:
      "context-filter",

    classification:
      "creator",

    result:
      "approved",

  })
)



console.log(
  "\n=== EVENTS ==="
)



console.log(
  getBoundaryEvents()
)
