import {
  getAllModuleKnowledge,
} from "../../data/moduleKnowledge/moduleKnowledgeProvider.js"



function normalizeText(
  value,
){

  return String(
    value || "",
  )
  .toLowerCase()
  .trim()

}



function calculateCapabilityScore(
  message,
  module,
){

  const text =
    normalizeText(
      message,
    )


  let score =
    0


  const searchable = [

    module.id,

    module.identity?.name,

    module.description,

    ...(module.capabilities || []),

    ...(module.inputs || []),

    ...(module.outputs || []),

  ]
  .join(" ")
  .toLowerCase()



  const words =
    text.split(
      /\s+/,
    )


  for(
    const word
    of words
  ){

    if(
      word.length < 3
    ){
      continue
    }


    if(
      searchable.includes(word)
    ){

      score += 5

    }

  }



  if(
    text.includes("muista") &&
    module.capabilities?.includes(
      "memory_learning",
    )
  ){

    score += 20

  }



  if(
    text.includes("spacemonkey") &&
    module.capabilities?.includes(
      "operator_identity",
    )
  ){

    score += 20

  }



  return score

}





function resolveModuleCapabilities(
  message,
){

  const knowledgeLayer =
    getAllModuleKnowledge()



  if(
    !knowledgeLayer ||
    !Array.isArray(
      knowledgeLayer.modules,
    )
  ){

    return {

      success:
        false,

      message,

      matches:
        [],

      error:
        "Module Knowledge Layer puuttuu.",

    }

  }



  const matches =

    knowledgeLayer.modules

      .map(

        module => ({

          module,

          score:
            calculateCapabilityScore(
              message,
              module,
            ),

        }),

      )

      .filter(

        item =>
          item.score > 0,

      )

      .sort(

        (
          a,
          b,
        ) =>
          b.score -
          a.score,

      )



  return {

    success:
      true,


    message,


    matches:

      matches.map(

        item => ({

          id:
            item.module.id,


          name:
            item.module.identity.name,


          score:
            item.score,


          capabilities:
            item.module.capabilities,


          description:
            item.module.description,

        }),

      ),

  }

}



export {

  resolveModuleCapabilities,

}
