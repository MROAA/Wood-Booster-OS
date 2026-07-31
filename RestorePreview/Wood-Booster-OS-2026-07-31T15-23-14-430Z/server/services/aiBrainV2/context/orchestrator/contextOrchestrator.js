/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CONTEXT ORCHESTRATOR V2


Vastuut:

- analysoi tarvittavat contextit
- hakee resolverit registryltä
- suorittaa tarvittavat resolverit


Ei:

- ei vastaa käyttäjälle
- ei kutsu LLM:ää
- ei muuta tietoa


=====================================
*/


import {
  analyzeContextRequirement,
} from "../contextIntelligenceEngine.js"



import {
  getResolver,
} from "../registry/contextResolverRegistry.js"







function createResolverPlan(
  requirements
){

  return Object

    .entries(
      requirements
    )

    .filter(

      ([,enabled]) =>
        enabled

    )

    .map(

      ([name]) =>
        name

    )

}








function executeResolvers({

  resolverNames = [],

  context = {},

} = {}){


  const results = []



  for(
    const resolverName
    of resolverNames
  ){


    const resolver =

      getResolver(
        resolverName
      )



    if(
      !resolver
    ){

      continue

    }



    const result =

      resolver(
        context
      )



    results.push(
      result
    )


  }



  return results

}








function createContextExecutionPlan({

  message = "",

} = {}){


  const analysis =

    analyzeContextRequirement({

      message

    })



  const resolverPlan =

    createResolverPlan(

      analysis.needs

    )



  return {


    message,


    requirements:

      analysis.needs,



    resolvers:

      resolverPlan,



    createdAt:

      new Date()
        .toISOString()


  }

}








function executeContextOrchestration({

  message = "",

  knowledge = [],

  memories = [],

  projects = [],

} = {}){


  const plan =

    createContextExecutionPlan({

      message

    })





  const resolverContext = {


    message,


    knowledge,


    memories,


    projects


  }






  const results =

    executeResolvers({

      resolverNames:

        plan.resolvers,


      context:

        resolverContext


    })






  return {


    plan,


    results,


    createdAt:

      new Date()
        .toISOString()


  }


}







export {

  createContextExecutionPlan,

  executeContextOrchestration

}
