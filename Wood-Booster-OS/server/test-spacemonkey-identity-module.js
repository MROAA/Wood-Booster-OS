import {
  createSpacemonkeyIdentityModule,
} from "./services/aiBrainV2/modules/spacemonkeyIdentityModule.js"



const module =
  createSpacemonkeyIdentityModule()



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
      "Haluan kehittää Spacemonkey AI:ta.",
  })
)



console.log(
  "EXECUTE:"
)



console.log(
  await module.execute({

    request:{
      requestId:
        "identity-test-001",
    },

  })
)
