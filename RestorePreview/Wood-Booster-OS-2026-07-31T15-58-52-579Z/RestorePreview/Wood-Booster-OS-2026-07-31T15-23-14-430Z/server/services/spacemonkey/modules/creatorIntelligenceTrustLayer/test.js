import {
  evaluateTrust,
  canUseKnowledge,
  getTrustRecords,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE TRUST LAYER ==="
)



const trust =
  evaluateTrust({

    source:
      "creator-knowledge-vault",


    version:
      true,


    integrity:
      true,


    backup:
      true,


    approved:
      true,

  })



console.log(
  "\n=== TRUST RESULT ==="
)



console.log(
  trust
)



console.log(
  "\n=== USAGE CHECK ==="
)



console.log(
  canUseKnowledge(
    trust
  )
)



console.log(
  "\n=== RECORDS ==="
)



console.log(
  getTrustRecords()
)
