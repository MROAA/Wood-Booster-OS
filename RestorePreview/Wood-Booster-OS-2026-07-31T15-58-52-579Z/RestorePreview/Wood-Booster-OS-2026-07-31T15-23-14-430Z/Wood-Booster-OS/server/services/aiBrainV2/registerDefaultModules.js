/*
=====================================
WOOD-BOOSTER AI BRAIN V2

DEFAULT MODULE REGISTRATION

Tämä tiedosto rekisteröi kaikki
AI Brain V2:n toimivat moduulit.

=====================================
*/


import {
  hasBrainModule,
  registerBrainModule,
} from "./moduleRegistry.js"



import {
  createDecisionModule,
} from "./modules/decisionModule.js"



import {
  createReasoningModule,
} from "./modules/reasoningModule.js"



import {
  createActionModule,
} from "./modules/actionModule.js"



import {
  createMemoryModule,
} from "./modules/memoryModule.js"



import {
  createMemoryLearningModule,
} from "./modules/memoryLearningModule.js"



import {
  createConversationModule,
} from "./modules/conversationModule.js"



import {
  createSpacemonkeyModule,
} from "./modules/spacemonkeyModule.js"



import {
  createCredentialsModule,
} from "./modules/credentialsModule.js"



import {
  createFinnishLanguageModule,
} from "./modules/finnishLanguageModule.js"





function registerModuleIfMissing(
  moduleDefinition,
) {

  if (
    hasBrainModule(
      moduleDefinition.id,
    )
  ) {
    return false
  }


  registerBrainModule(
    moduleDefinition,
  )


  return true
}





function registerDefaultBrainModules(){

  const registeredModules = []



  const defaultModules = [

    createSpacemonkeyModule(),


    createCredentialsModule(),


    createDecisionModule(),


    createReasoningModule(),


    createFinnishLanguageModule(),


    createMemoryLearningModule(),


    createActionModule(),


    createMemoryModule(),


    createConversationModule(),

  ]



  for (
    const moduleDefinition
    of defaultModules
  ){

    if (
      registerModuleIfMissing(
        moduleDefinition,
      )
    ){

      registeredModules.push(
        moduleDefinition.id,
      )

    }

  }



  return {

    initialized:
      true,


    registeredModules,

  }

}




export {
  registerDefaultBrainModules,
}
