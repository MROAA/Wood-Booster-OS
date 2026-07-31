import {
  createSpacemonkeyMemoryModule,
} from "./services/aiBrainV2/modules/spacemonkeyMemoryModule.js"



const module =
  createSpacemonkeyMemoryModule()



console.log(
  "MODULE:",
  {
    id:
      module.id,

    name:
      module.name,

    version:
      module.version,
  }
)



console.log(
  "HANDLE:"
)



console.log(
  module.canHandle({
    message:
      "Muista tämä: Spacemonkey syntyi 24.07.2026.",
  })
)



console.log(
  "EXECUTE:"
)



console.log(
  await module.execute({

    request:{
      requestId:
        "memory-test-001",
    },


    message:
      "Spacemonkey syntyi 24.07.2026.",

  })
)
