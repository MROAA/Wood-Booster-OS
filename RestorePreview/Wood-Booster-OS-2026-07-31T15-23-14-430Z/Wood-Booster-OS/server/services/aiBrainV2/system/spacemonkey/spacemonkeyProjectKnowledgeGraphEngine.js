const graphHistory = []



function createKnowledgeGraph({

  architecture,

  dependencies

}) {


  const graph = {


    nodes: [],


    edges: [],


    createdAt:

      new Date().toISOString()

  }



  addArchitectureNodes({

    architecture,

    graph

  })



  addDependencyEdges({

    dependencies,

    graph

  })



  graphHistory.push(

    graph

  )



  return graph

}





function addArchitectureNodes({

  architecture,

  graph

}) {


  if(!architecture){

    return

  }



  const groups = [

    {

      name:

        "frontend",


      items:

        architecture.frontend

    },


    {

      name:

        "backend",


      items:

        architecture.backend

    },


    {

      name:

        "other",


      items:

        architecture.other

    }

  ]



  for(

    const group

    of groups

  ){


    if(

      !Array.isArray(group.items)

    ){

      continue

    }



    for(

      const item

      of group.items

    ){


      graph.nodes.push(

        {

          id:

            item.path,


          type:

            item.type || group.name,


          layer:

            group.name

        }

      )

    }

  }

}





function addDependencyEdges({

  dependencies,

  graph

}) {


  if(

    !dependencies ||

    !Array.isArray(dependencies.connections)

  ){

    return

  }



  for(

    const connection

    of dependencies.connections

  ){


    graph.edges.push(

      {

        from:

          connection.from,


        to:

          connection.to,


        type:

          connection.type

      }

    )

  }

}





function findNode({

  path

}) {


  for(

    const graph

    of graphHistory

  ){


    const node =

      graph.nodes.find(

        item =>

          item.id === path

      )



    if(node){

      return node

    }

  }



  return null

}





function getKnowledgeGraphs(){


  return [

    ...graphHistory

  ]

}





function getProjectKnowledgeGraphStatus(){


  return {


    engine:

      "Spacemonkey Project Knowledge Graph Engine",


    version:

      "0.1.0",


    graphs:

      graphHistory.length

  }

}



export {

  createKnowledgeGraph,

  findNode,

  getKnowledgeGraphs,

  getProjectKnowledgeGraphStatus

}
