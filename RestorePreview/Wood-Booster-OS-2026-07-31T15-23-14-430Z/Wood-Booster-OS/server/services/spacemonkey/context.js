/*
  Spacemonkey Context Layer V2

  Rakentaa täydellisen Spacemonkey
  käyttöjärjestelmäkontekstin.

  Sisältää:

  - Core identity
  - Personality
  - Environment
  - Capabilities
  - Knowledge database

  Ei:
  - kutsu AI Brainia
  - tallenna muistia
  - suorita toimintoja

*/


import {
  getSpacemonkeyCore,
} from "./index.js"


import {
  createSpacemonkeyKnowledgeContext,
} from "./knowledgeAdapter.js"



async function createSpacemonkeyContext(){

  const core =
    getSpacemonkeyCore()



  const knowledge =
    await createSpacemonkeyKnowledgeContext()



  return {

    system:
    {

      name:
        core.name,


      role:
        core.role,


      identity:
        core.identity,

    },


    personality:
      core.personality,


    environment:
      core.environment,


    capabilities:
      core.capabilities,


    knowledge:

    {

      enabled:
        knowledge.success,


      documentCount:
        knowledge.count || 0,


      context:
        knowledge.context || "",


      documents:
        knowledge.documents || [],

    },


    metadata:

    {

      version:
        core.version,


      createdAt:
        core.createdAt,


      source:
        "spacemonkey-core",

    },

  }

}



export {

  createSpacemonkeyContext,

}
