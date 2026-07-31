import {
  createSpacemonkeyModule
} from "../modules/spacemonkeyModule.js"



import {
  createSpacemonkeyRuntimeContext
} from "../services/spacemonkeyRuntimeContextProvider.js"





const module =
  createSpacemonkeyModule()





const runtimeContext =
  createSpacemonkeyRuntimeContext({

    message:
      "Mikä on Spacemonkey?"

  })





const result =
  await module.execute({

    message:
      "Mikä on Spacemonkey?",


    request:{

      requestId:
        "knowledge-test"

    },


    runtimeContext

  })





console.log(
  "SPACEMONKEY MODULE KNOWLEDGE TEST"
)



console.dir(
  result,
  {
    depth:null
  }
)
