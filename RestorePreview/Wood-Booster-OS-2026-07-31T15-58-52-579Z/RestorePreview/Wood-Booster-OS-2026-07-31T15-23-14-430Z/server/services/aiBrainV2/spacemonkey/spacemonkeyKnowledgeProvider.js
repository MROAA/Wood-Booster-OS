/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY KNOWLEDGE PROVIDER V1


Vastuut:

- tarjoaa turvallisen rajapinnan
  Spacemonkey Knowledge Layeriin

- lukee runtime contextin
- palauttaa käytettävän tiedon


Ei:

- kirjoita muistia
- tee päätöksiä
- kutsu LLM:ää
- muokkaa knowledge-dataa


=====================================
*/



function getSpacemonkeyKnowledge({

  runtimeContext = {},

} = {}){


  const knowledge =

    runtimeContext
      ?.spacemonkeyKnowledge



  if(
    !knowledge
  ){

    return {

      enabled:false,

      sources:0,

      knowledge:[]

    }

  }



  return {


    enabled:true,


    sources:

      knowledge.totalSources ||
      0,


    characters:

      knowledge.totalCharacters ||
      0,


    highestPriority:

      knowledge.highestPriority ||
      0,


    knowledge:

      Array.isArray(
        knowledge.knowledge
      )

        ? knowledge.knowledge

        : []

  }


}







function getKnowledgeSources({

  runtimeContext = {},

} = {}){


  const result =

    getSpacemonkeyKnowledge({

      runtimeContext

    })



  return result
    .knowledge
    .map(
      item => item.id
    )

}



function findKnowledgeByCategory({

  runtimeContext = {},

  category,

} = {}){


  const result =

    getSpacemonkeyKnowledge({

      runtimeContext

    })



  return result
    .knowledge
    .filter(
      item =>
        item.category === category
    )

}





export {

  getSpacemonkeyKnowledge,

  getKnowledgeSources,

  findKnowledgeByCategory,

}
