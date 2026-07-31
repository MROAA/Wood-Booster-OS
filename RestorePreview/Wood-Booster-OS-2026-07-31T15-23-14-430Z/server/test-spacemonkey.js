import {
  createSpacemonkeyRuntime,
} from "./services/spacemonkey/runtime.js"


import {
  runSpacemonkeyBrain,
} from "./services/spacemonkey/brainBridge.js"



try {


  const runtime =
    await createSpacemonkeyRuntime({

      userMessage:
        "Kuka olet?",

    })


  console.log(
    "STARTING SPACEMONKEY BRAIN TEST",
  )



  const result =
    await runSpacemonkeyBrain({

      runtime,

    })



  console.log(
    "BRAIN RESULT RECEIVED",
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


console.log(
  "TEST FINISHED - PRESS CTRL+C",
)
