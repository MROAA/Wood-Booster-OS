import {
  createSpacemonkeyRuntimeContext
} from "./spacemonkeyRuntimeContextProvider.js"



const context =

  createSpacemonkeyRuntimeContext({

    message:

      "Miten kirjoitan Python ohjelman?"

  })



console.log(
  "SPACEMONKEY CONTEXT DEBUG RUNTIME"
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

          context
            .spacemonkeyKnowledge
            ?.totalSources,


        characters:

          context
            .spacemonkeyKnowledge
            ?.totalCharacters

      },


    fusion:

      context.spacemonkeyContextFusion,


    debug:

      context.spacemonkeyContextDebug

  },


  {
    depth:null
  }

)
