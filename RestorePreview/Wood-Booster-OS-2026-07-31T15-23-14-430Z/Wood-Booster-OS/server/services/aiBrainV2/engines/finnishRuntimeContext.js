/*
=====================================
WOOD-BOOSTER AI BRAIN V2

FINNISH RUNTIME CONTEXT ENGINE V1.1

Vastuut:

- lataa suomalaisen identiteetin
- muuntaa sen AI Contextiksi
- tarjoaa runtime-käyttöön

Tämä ei:

- kutsu kielimallia
- tallenna muistia
- muuta tietokantaa
- muuta moduulireititystä

=====================================
*/


import {
  loadFinnishIdentity,
} from "./finnishIdentityEngine.js"


import {
  createFinnishContext,
} from "./finnishContextAdapter.js"



async function createFinnishRuntimeContext(){

  const identity =
    await loadFinnishIdentity()


  const finnishContext =
    createFinnishContext({
      identity,
    })


  return {

    enabled:
      finnishContext.enabled,


    language:
      finnishContext.language,


    culture:
      finnishContext.culture,


    identity:

      finnishContext.context || "",


    documentCount:

      finnishContext.documentCount || 0,


    sourceDocuments:

      identity.documents || [],


    rules:[

      "Käytä selkeää suomen kieltä.",

      "Ole suora ja käytännöllinen.",

      "Vältä turhaa markkinointipuhetta.",

      "Huomioi suomalainen huumori.",

      "Arvosta tekemistä enemmän kuin lupauksia.",

    ],

  }

}



export {
  createFinnishRuntimeContext,
}
