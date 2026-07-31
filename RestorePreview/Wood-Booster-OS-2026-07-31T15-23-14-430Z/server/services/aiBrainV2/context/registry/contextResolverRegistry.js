/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CONTEXT RESOLVER REGISTRY V1


Vastuut:

- rekisteröi kaikki context resolverit
- tarjoaa yhden rajapinnan
- mahdollistaa modulaarisen laajentamisen


Ei:

- ei suorita resolvereita itse
- ei tee päätöksiä
- ei muuta contextia


=====================================
*/


import {
  resolveIdentityContext,
} from "../resolvers/identityResolver.js"



import {
  resolveSecurityContext,
} from "../resolvers/securityResolver.js"



import {
  resolveProgrammingContext,
} from "../resolvers/programmingResolver.js"



import {
  resolveMemoryContext,
} from "../resolvers/memoryResolver.js"



import {
  resolveProjectContext,
} from "../resolvers/projectResolver.js"







const resolverRegistry = {


  identity:

    resolveIdentityContext,



  security:

    resolveSecurityContext,



  programming:

    resolveProgrammingContext,



  memory:

    resolveMemoryContext,



  projects:

    resolveProjectContext


}








function getResolver(
  id
){

  return resolverRegistry[id]

}








function getRegisteredResolvers(){

  return Object.keys(
    resolverRegistry
  )

}







export {

  getResolver,

  getRegisteredResolvers

}
