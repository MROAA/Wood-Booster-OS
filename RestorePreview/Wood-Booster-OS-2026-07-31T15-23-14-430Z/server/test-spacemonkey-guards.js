/*
=====================================

SPACEMONKEY GUARD TEST

Testaa:

- Identity Guard
- Behavior Guard
- Memory Policy Guard

=====================================
*/


import {
  validateSpacemonkeyIdentityResponse,
} from "./services/spacemonkey/spacemonkeyResponseIdentityGuard.js"



import {
  validateSpacemonkeyBehaviorResponse,
} from "./services/spacemonkey/spacemonkeyBehaviorGuard.js"



import {
  validateMemoryProposal,
  getSpacemonkeyMemoryPolicyGuardStatus,
} from "./services/spacemonkey/spacemonkeyMemoryPolicyGuard.js"





console.log(`
🧠 SPACEMONKEY GUARD TEST
=========================
`)



console.log(
  "MEMORY POLICY STATUS"
)



console.log(
  JSON.stringify(
    getSpacemonkeyMemoryPolicyGuardStatus(),
    null,
    2,
  )
)





console.log(`
--------------------------------
IDENTITY GUARD TEST
--------------------------------
`)



const identityTest =

  validateSpacemonkeyIdentityResponse({

    answer:
      "Olen vain tavallinen chatbot.",

  })



console.log(
  JSON.stringify(
    identityTest,
    null,
    2,
  )
)





console.log(`
--------------------------------
BEHAVIOR GUARD TEST
--------------------------------
`)



const behaviorTest =

  validateSpacemonkeyBehaviorResponse({

    answer:
      "En tiedä varmasti mitään. Olen ehkä vain botti.",

  })



console.log(
  JSON.stringify(
    behaviorTest,
    null,
    2,
  )
)





console.log(`
--------------------------------
MEMORY POLICY TEST
--------------------------------
`)



const memoryTests = [

  {

    key:
      "assistant_identity",

    category:
      "assistant",

  },


  {

    key:
      "spacemonkey_identity",

    category:
      "preference",

  },


  {

    key:
      "temporary_chat",

    category:
      "conversation",

  },

]





for(
  const proposal
  of memoryTests
){

  console.log(

    JSON.stringify(

      validateMemoryProposal({

        proposal,

      }),

      null,

      2,

    )

  )

}





console.log(`
✅ SPACEMONKEY GUARD TEST COMPLETE
`)
