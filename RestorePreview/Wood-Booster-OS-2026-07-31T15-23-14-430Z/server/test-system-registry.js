import {
  registerSystemModule,
  getSystemModules,
  getSystemModule,
  updateSystemModuleStatus
} from "./services/llmSystem/core/systemRegistry.js"





console.log("")

console.log(
  "🗂️ SYSTEM REGISTRY TEST"
)

console.log(
  "====================="
)





function runTest(){



  console.log("")

  console.log(
    "REGISTER MODULES"
  )



  registerSystemModule({

    id:
      "spacemonkey",

    name:
      "Spacemonkey Core",

    version:
      "1.0.0",

    type:
      "operator",

    capabilities:[

      "identity",

      "runtime_status",

      "ai_operator"

    ]

  })





  registerSystemModule({

    id:
      "aiBrain",

    name:
      "AI Brain V2",

    version:
      "1.1.0",

    type:
      "intelligence",

    capabilities:[

      "reasoning",

      "knowledge",

      "truth"

    ]

  })





  console.log(
    JSON.stringify(
      getSystemModules(),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "GET SINGLE MODULE"
  )



  console.log(
    JSON.stringify(
      getSystemModule(
        "aiBrain"
      ),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "UPDATE STATUS"
  )



  console.log(
    JSON.stringify(
      updateSystemModuleStatus({

        id:
          "aiBrain",

        status:
          "READY"

      }),
      null,
      2
    )
  )





  console.log("")

  console.log(
    "✅ SYSTEM REGISTRY TEST COMPLETE"
  )


}





runTest()
