import {
  createFinnishLanguageModule,
} from "./services/aiBrainV2/modules/finnishLanguageModule.js"



const module =
  createFinnishLanguageModule()



console.log(
  "MODULE:",
  {
    id:
      module.id,

    name:
      module.name,

    version:
      module.version,
  },
)



const result =
  module.canHandle({

    message:
      "Haluan suomalaisen käsityöhenkisen Wood-Booster AI:n."

  })



console.log(
  "\nCAN HANDLE:",
)

console.log(
  result,
)



if (
  result.matched
){

  const execution =
    await module.execute({

      message:
        "Haluan suomalaisen käsityöhenkisen Wood-Booster AI:n.",


      request:{
        requestId:
          "test-finnish-001",
      },

    })


  console.log(
    "\nEXECUTION RESULT:",
  )


  console.log({

    type:
      execution.type,


    language:
      execution.context.language,


    culture:
      execution.context.culture,


    identityLoaded:
      execution.context.identityLoaded,


    identityDocuments:
      execution.context.identityDocuments,


    guidance:
      execution.guidance,

  })

}
