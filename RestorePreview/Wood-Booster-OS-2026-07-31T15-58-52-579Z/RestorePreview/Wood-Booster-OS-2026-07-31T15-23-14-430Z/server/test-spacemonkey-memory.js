import prisma from "./prisma.js"


import {
  createSpacemonkeyRuntime,
} from "./services/spacemonkey/runtime.js"


import {
  runSpacemonkeyBrain,
} from "./services/spacemonkey/brainBridge.js"



try {


  console.log(
    "STARTING SPACEMONKEY MEMORY TEST",
  )


  const runtime =
    createSpacemonkeyRuntime({

      userMessage:
        "Mitä tiedät minusta?",

    })



  runtime.runtime.prisma =
    prisma



  console.log(
    "SPACEMONKEY RUNTIME READY",
  )



  const result =
    await runSpacemonkeyBrain({

      runtime,

    })



  console.log(
    "SPACEMONKEY MEMORY RESULT",
  )


  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  )


}


catch(error) {


  console.error(
    "TEST FAILED",
  )


  console.error(
    error,
  )


}


finally {


  await prisma.$disconnect()


}

