import {
  createDecisionRecord,
  updateDecisionOutcome,
  getDecisionHistory,
  getCriticalDecisions,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECURITY DECISION RECORD ==="
)



const decision =
  createDecisionRecord({

    action:
      "Allow external API connection",

    risk:
      "critical",

    decision:
      "approved",

    reason:
      "Required for controlled knowledge retrieval.",

    approvedBy:
      "operator",

  })



console.log(
  decision
)



console.log(
  "\n=== UPDATE OUTCOME ==="
)



console.log(
  updateDecisionOutcome({

    id:
      decision.id,

    outcome:
      "completed-successfully",

  })
)



console.log(
  "\n=== DECISION HISTORY ==="
)



console.log(
  getDecisionHistory()
)



console.log(
  "\n=== CRITICAL DECISIONS ==="
)



console.log(
  getCriticalDecisions()
)
