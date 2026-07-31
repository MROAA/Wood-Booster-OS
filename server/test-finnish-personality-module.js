import {
  createFinnishPersonalityModule,
} from "./services/aiBrainV2/modules/finnishPersonalityModule.js"



const module =
  createFinnishPersonalityModule()



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
  "HANDLE:",
  module.canHandle({
    message:
      "Haluan rakentaa suomalaisen Wood-Booster AI:n.",
  })
)



console.log(
  "EXECUTE:"
)



console.log(
  await module.execute({

    request:{
      requestId:
        "test-001",
    },

  })
)
