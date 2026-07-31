import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const capabilityRegistry = [


  {


    id:
      "reasoning",


    name:
      "Reasoning Capability",


    description:
      "Analyzes information and creates conclusions.",


    strength:
      10

  },


  {


    id:
      "planning",


    name:
      "Planning Capability",


    description:
      "Creates structured execution plans.",


    strength:
      10

  },


  {


    id:
      "memory_management",


    name:
      "Memory Capability",


    description:
      "Stores and retrieves learned information.",


    strength:
      8

  },


  {


    id:
      "knowledge_management",


    name:
      "Knowledge Capability",


    description:
      "Manages system knowledge.",


    strength:
      8

  }


]



const capabilityHistory = []



function findCapability({

  requirement,

}) {


  const text =
    String(requirement)
      .toLowerCase()



  const matches =

    capabilityRegistry.filter(

      capability =>

        text.includes(
          capability.id
        )

        ||

        text.includes(
          capability.name.toLowerCase()
        )

    )



  return matches

}



function evaluateCapability({

  capability,

  requirement

}) {


  const score =

    capability.strength / 10



  return {


    capability,


    requirement,


    score,


    suitable:

      score >= 0.5

  }

}



function selectBestCapability({

  requirement

}) {


  const matches =
    findCapability({

      requirement

    })



  if(
    matches.length === 0
  ){


    return {


      found:false,


      requirement,


      suggestion:

        "New capability may be required"

    }

  }



  const evaluated =

    matches.map(

      capability =>

        evaluateCapability({

          capability,

          requirement

        })

    )



  const best =

    evaluated.sort(

      (a,b)=>

        b.score -
        a.score

    )[0]



  capabilityHistory.push({

    requirement,

    selected:
      best,


    timestamp:
      new Date().toISOString()

  })



  return {


    found:true,


    selected:
      best

  }


}



function suggestNewCapability({

  requirement

}) {


  return {


    type:
      "capability_creation",


    requirement,


    reason:
      "Existing capabilities cannot fully satisfy requirement.",


    status:
      "proposal"

  }

}



function getCapabilityStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    capabilities:
      capabilityRegistry,


    history:
      capabilityHistory

  }

}



export {

  findCapability,

  selectBestCapability,

  suggestNewCapability,

  getCapabilityStatus

}
