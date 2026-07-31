const relationshipHistory = []



function analyzeFileRelationship({

  filePath,

  sourceCode

}) {


  const imports =

    extractImports(

      sourceCode

    )



  const relationship = {


    filePath:

      filePath || null,


    imports,


    dependencies:

      imports,


    connections:

      createConnections({

        filePath,

        imports

      }),


    createdAt:

      new Date().toISOString()

  }



  relationshipHistory.push(

    relationship

  )



  return relationship

}





function extractImports(sourceCode){


  if(!sourceCode){

    return []

  }



  const matches =

    sourceCode.match(

      /import\s+.*?from\s+["'](.*?)["']/g

    )



  if(!matches){

    return []

  }



  return matches.map(

    item => {


      const result =

        item.match(

          /from\s+["'](.*?)["']/

        )


      return result
        ? result[1]
        : null

    }

  ).filter(Boolean)

}





function createConnections({

  filePath,

  imports

}) {


  return imports.map(

    dependency =>

    ({

      from:

        filePath || null,


      to:

        dependency,


      type:

        "import"

    })

  )

}





function findRelationships({

  filePath

}) {


  return relationshipHistory.filter(

    item =>

      item.filePath === filePath

  )

}





function getFileRelationshipStatus(){


  return {


    engine:

      "Spacemonkey File Relationship Engine",


    version:

      "0.1.0",


    relationships:

      relationshipHistory.length

  }

}



export {

  analyzeFileRelationship,

  findRelationships,

  getFileRelationshipStatus

}
