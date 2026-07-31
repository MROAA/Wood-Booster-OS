/*
=====================================

SPACEMONKEY KERNEL GUARD TEST V1


Testaa:

- Identity Guard
- Behavior Guard
- Kernel yhdistelmä


=====================================
*/


import {
  applySpacemonkeyKernelGuard,
} from "./services/spacemonkey/spacemonkeyKernelGuard.js"



import {
  getSpacemonkeyKernelGuardStatus,
} from "./services/spacemonkey/spacemonkeyKernelGuard.js"





console.log(`
🧠 SPACEMONKEY KERNEL GUARD TEST
================================
`)



console.log(
  "STATUS"
)



console.log(
  JSON.stringify(
    getSpacemonkeyKernelGuardStatus(),
    null,
    2,
  )
)





console.log(`
--------------------------------
TEST 1: NORMAL RESPONSE
--------------------------------
`)



console.log(

  JSON.stringify(

    applySpacemonkeyKernelGuard({

      answer:
        "Olen Spacemonkey, digitaalinen työpari ja AI-käyttöjärjestelmän operaattori.",

    }),

    null,

    2,

  )

)





console.log(`
--------------------------------
TEST 2: WRONG IDENTITY
--------------------------------
`)



console.log(

  JSON.stringify(

    applySpacemonkeyKernelGuard({

      answer:
        "Olen vain tavallinen chatbot.",

    }),

    null,

    2,

  )

)





console.log(`
--------------------------------
TEST 3: UNCERTAIN RESPONSE
--------------------------------
`)



console.log(

  JSON.stringify(

    applySpacemonkeyKernelGuard({

      answer:
        "Olen ehkä joku botti enkä tiedä kuka olen.",

    }),

    null,

    2,

  )

)





console.log(`
✅ SPACEMONKEY KERNEL GUARD TEST COMPLETE
`)
