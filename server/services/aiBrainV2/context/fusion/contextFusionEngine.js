/*
=====================================

WOOD-BOOSTER AI BRAIN V2

CONTEXT FUSION ENGINE V1


Vastuut:

- yhdistää resolverien tulokset
- muodostaa yhden context-paketin
- valmistaa AI Brainille syötteen


Ei:

- ei päätä vastausta
- ei kutsu LLM:ää
- ei muokkaa alkuperäistä tietoa


=====================================
*/





function collectKnowledge(results = []){

  const knowledge = []



  for(
    const result
    of results
  ){

    if(
      Array.isArray(
        result.knowledge
      )
    ){

      knowledge.push(
        ...result.knowledge
      )

    }

  }



  return knowledge

}








function collectMemories(results = []){

  const memories = []



  for(
    const result
    of results
  ){

    if(
      Array.isArray(
        result.memories
      )
    ){

      memories.push(
        ...result.memories
      )

    }

  }



  return memories

}








function collectProjects(results = []){

  const projects = []



  for(
    const result
    of results
  ){

    if(
      Array.isArray(
        result.projects
      )
    ){

      projects.push(
        ...result.projects
      )

    }

  }



  return projects

}








function createContextFusion({

  orchestration = {},

} = {}){


  const results =

    orchestration.results || []





  return {


    source:

      "context-fusion-engine",



    version:

      "1.0.0",



    resolvers:

      results.map(

        item =>
          item.resolver

      ),




    knowledge:

      collectKnowledge(
        results
      ),



    memories:

      collectMemories(
        results
      ),



    projects:

      collectProjects(
        results
      ),




    createdAt:

      new Date()
        .toISOString()


  }


}







export {

  createContextFusion

}
