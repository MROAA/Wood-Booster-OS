import {
  STATES,
  createLifecycleEntry,
  setLifecycleState,
  getLifecycleState,
  getAllLifecycleStates
} from "./services/llmSystem/core/lifecycleManager.js"





console.log("")

console.log(
  "🔄 LIFECYCLE MANAGER TEST"
)

console.log(
  "========================"
)





function runTest(){



  console.log("")

  console.log(
    "CREATE MODULE"
  )



  createLifecycleEntry({

    id:
      "spacemonkey"

  })



  console.log(
    JSON.stringify(
      getLifecycleState(
        "spacemonkey"
      ),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "INITIALIZING"
  )



  setLifecycleState({

    id:
      "spacemonkey",

    state:
      STATES.INITIALIZING

  })



  console.log(
    JSON.stringify(
      getLifecycleState(
        "spacemonkey"
      ),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "READY"
  )



  setLifecycleState({

    id:
      "spacemonkey",

    state:
      STATES.READY

  })



  console.log(
    JSON.stringify(
      getLifecycleState(
        "spacemonkey"
      ),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "RUNNING"
  )



  setLifecycleState({

    id:
      "spacemonkey",

    state:
      STATES.RUNNING

  })



  console.log(
    JSON.stringify(
      getLifecycleState(
        "spacemonkey"
      ),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "STOPPED"
  )



  setLifecycleState({

    id:
      "spacemonkey",

    state:
      STATES.STOPPED

  })



  console.log(
    JSON.stringify(
      getLifecycleState(
        "spacemonkey"
      ),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "ALL STATES"
  )


  console.log(
    JSON.stringify(
      getAllLifecycleStates(),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "✅ LIFECYCLE MANAGER TEST COMPLETE"
  )


}





runTest()
