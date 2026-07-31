import {
  createModuleKnowledge,
} from "../moduleKnowledgeSchema.js"



const finnishLanguageKnowledge =

  createModuleKnowledge({

    id:
      "finnish_language",


    name:
      "Finnish Language Module",


    version:
      "1.2.0",


    description:
      "Suomen kielen, suomalaisen ilmaisun ja suomalaisen identiteettikontekstin käsittelymoduuli.",


    capabilities: [

      "finnish_language",

      "grammar_analysis",

      "language_style",

      "cultural_context",

    ],


    inputs: [

      "user_message",

      "conversation_context",

      "response_context",

    ],


    outputs: [

      "language_context",

      "style_guidance",

      "language_result",

    ],


    permissions: {

      database:
        false,


      execution:
        false,

    },

  })



export {

  finnishLanguageKnowledge,

}
