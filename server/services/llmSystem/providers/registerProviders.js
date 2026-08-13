import {
  registerContextProvider
} from "../core/contextProviders.js"



import {
  systemProvider
} from "./systemProvider.js"



import {
  identityProvider
} from "./identityProvider.js"



import {
  memoryProvider
} from "./memory/memoryProvider.js"



import {
  knowledgeProvider
} from "./knowledge/knowledgeProvider.js"



import {
  finnishCultureProvider
} from "./finnish/finnishCultureProvider.js"



import {
  spacemonkeyPersonaProvider
} from "./spacemonkey/spacemonkeyPersonaProvider.js"



import {
  creatorIdentityProvider
} from "./spacemonkey/creator/creatorIdentityProvider.js"







function registerDefaultContextProviders(){


  registerContextProvider(
    systemProvider
  )


  registerContextProvider(
    identityProvider
  )


  registerContextProvider(
    memoryProvider
  )


  registerContextProvider(
    knowledgeProvider
  )


  registerContextProvider(
    finnishCultureProvider
  )


  registerContextProvider(
    spacemonkeyPersonaProvider
  )


  registerContextProvider(
    creatorIdentityProvider
  )



  return [

    systemProvider.id,

    identityProvider.id,

    memoryProvider.id,

    knowledgeProvider.id,

    finnishCultureProvider.id,

    spacemonkeyPersonaProvider.id,

    creatorIdentityProvider.id

  ]

}





export {

  registerDefaultContextProviders

}
