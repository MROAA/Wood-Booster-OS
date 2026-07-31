import {
  recordPersonalityEvent,
  getAuditHistory,
  getEventsByType,
  getLatestEvents,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY AUDIT LOG ==="
)



console.log(
  recordPersonalityEvent({

    type:
      "humor-used",

    source:
      "humor-personality",

    description:
      "Optional humor response was generated.",

    context:

      {
        situation:
          "casual-conversation",

      },

  })
)



console.log(
  recordPersonalityEvent({

    type:
      "rule-applied",

    source:
      "personality-rule-registry",

    description:
      "Friendly communication rule applied.",

    context:

      {
        rule:
          "friendly-character",

      },

  })
)



console.log(
  "\n=== AUDIT HISTORY ==="
)



console.log(
  getAuditHistory()
)



console.log(
  "\n=== HUMOR EVENTS ==="
)



console.log(
  getEventsByType(
    "humor-used"
  )
)



console.log(
  "\n=== LATEST EVENTS ==="
)



console.log(
  getLatestEvents()
)
