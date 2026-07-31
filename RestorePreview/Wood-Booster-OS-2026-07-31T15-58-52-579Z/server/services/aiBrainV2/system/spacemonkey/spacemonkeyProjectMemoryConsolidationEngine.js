const projectMemoryHistory = []



function consolidateProjectMemory({

  projectName,

  knowledgeGraph,

  architecture,

  codeMemories

}) {


  const memory = {


    projectName:

      projectName || "unknown",


    components:

      extractComponents({

        knowledgeGraph

      }),


    architecture:

      summarizeArchitecture({

        architecture

      }),


    codeMemories:

      codeMemories || [],


    createdAt:

      new Date().toISOString()

  }



  projectMemoryHistory.push(

    memory

  )



  return memory

}





function extractComponents({

  knowledgeGraph

}) {


  if(

    !knowledgeGraph ||

    !Array.isArray(knowledgeGraph.nodes)

  ){

    return []

  }



  return knowledgeGraph.nodes.map(

    node =>

    ({

      path:

        node.id,


      type:

        node.type,


      layer:

        node.layer

    })

  )

}





function summarizeArchitecture({

  architecture

}) {


  if(!architecture){

    return {

      frontend:0,

      backend:0,

      other:0

    }

  }



  return {


    frontend:

      architecture.frontend?.length || 0,


    backend:

      architecture.backend?.length || 0,


    other:

      architecture.other?.length || 0

  }

}





function searchProjectMemory({

  keyword

}) {


  const results = []



  for(

    const memory

    of projectMemoryHistory

  ){


    const text =

      JSON.stringify(

        memory

      )

      .toLowerCase()



    if(

      text.includes(

        String(keyword || "")

          .toLowerCase()

      )

    ){


      results.push(

        memory

      )

    }

  }



  return results

}





function getProjectMemoryHistory(){


  return [

    ...projectMemoryHistory

  ]

}





function getProjectMemoryStatus(){


  return {


    engine:

      "Spacemonkey Project Memory Consolidation Engine",


    version:

      "0.1.0",


    memories:

      projectMemoryHistory.length

  }

}



export {

  consolidateProjectMemory,

  searchProjectMemory,

  getProjectMemoryHistory,

  getProjectMemoryStatus

}
