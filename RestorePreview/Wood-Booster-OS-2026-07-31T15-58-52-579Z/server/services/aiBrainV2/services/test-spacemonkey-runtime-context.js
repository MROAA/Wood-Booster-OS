import {
  createSpacemonkeyRuntimeContext
} from "./spacemonkeyRuntimeContextProvider.js"



const context =
  createSpacemonkeyRuntimeContext({

    message:
      "Mikä on Spacemonkeyn persoonallisuus?"

  })



console.log(
  "SPACEMONKEY RUNTIME CONTEXT V5"
)



console.dir(
  {

    kernel:
      context.spacemonkeyKernelVersion,


    personality:
      context.spacemonkeyPersonalityEnabled,


    responseStyle:
      context.spacemonkeyResponseStyleEnabled,


    knowledge:
      {

        enabled:
          context.spacemonkeyKnowledgeEnabled,


        sources:
          context.spacemonkeyKnowledge
            ?.totalSources,


        characters:
          context.spacemonkeyKnowledge
            ?.totalCharacters,


        categories:
          context.spacemonkeyKnowledge
            ?.categories,


        sourceIds:

          context.spacemonkeyKnowledge
            ?.knowledge
            ?.map(

              item =>
                item.id

            )

      }

  },

  {
    depth:null
  }

)