const dependencyHistory = []



function analyzeDependencies({

  relationships

}) {


  const result = {


    nodes: [],


    connections: [],


    createdAt:

      new Date().toISOString()

  }



  if(

    !Array.isArray(relationships)

  ){

    dependencyHistory.push(result)

    return result

  }



  for(

    const relationship

    of relationships

  ){


    const source =

      relationship.from



    const target =

      relationship.to



    result.nodes.push(

      source

    )



    result.nodes.push(

      target

    )



    result.connections.push(

      {

        from:

          source,


        to:

          target,


        type:

          relationship.type || "dependency"

      }

    )

  }



  result.nodes =

    removeDuplicates(

      result.nodes

    )



  dependencyHistory.push(

    result

  )



  return result

}





function removeDuplicates(items){


  return [

    ...

    new Set(items)

  ]

}





function findImpact({

  filePath

}) {


  const impacted = []



  for(

    const item

    of dependencyHistory

  ){


    for(

      const connection

      of item.connections

    ){


      if(

        connection.from === filePath

      ){


        impacted.push(

          connection.to

        )

      }

    }

  }



  return [

    ...

    new Set(impacted)

  ]

}





function getDependencyHistory(){


  return [

    ...dependencyHistory

  ]

}





function getDependencyUnderstandingStatus(){


  return {


    engine:

      "Spacemonkey Dependency Understanding Engine",


    version:

      "0.1.0",


    analyses:

      dependencyHistory.length

  }

}



export {

  analyzeDependencies,

  findImpact,

  getDependencyUnderstandingStatus

}
