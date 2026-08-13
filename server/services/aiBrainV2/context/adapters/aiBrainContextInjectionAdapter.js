/*
=====================================

WOOD-BOOSTER AI BRAIN V2

AI BRAIN CONTEXT INJECTION ADAPTER V1


Vastuut:

- muuttaa Fusion Context AI Brain muotoon
- rakentaa LLM-context osan
- säilyttää lähteiden erot


Ei:

- ei kutsu mallia
- ei tee päätöksiä
- ei muuta alkuperäistä dataa


=====================================
*/





function createKnowledgeSection(
  knowledge = []
){

  if(
    !Array.isArray(
      knowledge
    )
  ){

    return ""

  }



  return knowledge

    .map(

      item =>

        `[${item.id}]\n${item.content}`

    )

    .join(

      "\n\n"

    )

}








function createMemorySection(
  memories = []
){

  if(
    !Array.isArray(
      memories
    )
  ){

    return ""

  }



  return memories

    .map(

      memory =>

        `[${memory.key || "memory"}]\n${memory.content}`

    )

    .join(

      "\n\n"

    )

}








function createProjectSection(
  projects = []
){

  if(
    !Array.isArray(
      projects
    )
  ){

    return ""

  }



  return projects

    .map(

      project =>

        JSON.stringify(
          project,
          null,
          2
        )

    )

    .join(

      "\n\n"

    )

}








function createAIBrainContextInjection({

  fusionContext = {},

} = {}){


  return {


    source:

      "ai-brain-context-injection",



    version:

      "1.0.0",



    systemContext:


      createKnowledgeSection(

        fusionContext.knowledge

      ),



    memoryContext:


      createMemorySection(

        fusionContext.memories

      ),



    projectContext:


      createProjectSection(

        fusionContext.projects

      ),



    metadata:{

      resolvers:

        fusionContext.resolvers || [],


      createdAt:

        new Date()
          .toISOString()

    }


  }


}







export {

  createAIBrainContextInjection

}
