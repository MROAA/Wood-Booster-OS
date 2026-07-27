const contextHistory = []



function createProjectContext({

  projectName,

  files,

  relationships,

  architecture

}) {


  const context = {


    projectName:

      projectName || "unknown",


    files:

      normalizeFiles(files),


    relationships:

      relationships || [],


    architecture:

      architecture || null,


    summary:

      createSummary({

        files,

        relationships

      }),


    createdAt:

      new Date().toISOString()

  }



  contextHistory.push(

    context

  )



  return context

}





function normalizeFiles(files){


  if(!Array.isArray(files)){

    return []

  }



  return files.map(

    file =>

    ({

      path:

        file.path || file,


      type:

        detectFileType(

          file.path || file

        )

    })

  )

}





function detectFileType(filePath){


  if(!filePath){

    return "unknown"

  }



  if(

    filePath.endsWith(".jsx")

  ){

    return "react-component"

  }



  if(

    filePath.endsWith(".js")

  ){

    return "javascript"

  }



  if(

    filePath.endsWith(".css")

  ){

    return "style"

  }



  if(

    filePath.endsWith(".json")

  ){

    return "configuration"

  }



  return "other"

}





function createSummary({

  files,

  relationships

}) {


  return {


    fileCount:

      Array.isArray(files)

        ? files.length

        : 0,


    relationshipCount:

      Array.isArray(relationships)

        ? relationships.length

        : 0

  }

}





function getProjectContexts(){


  return [

    ...contextHistory

  ]

}





function getProjectContextStatus(){


  return {


    engine:

      "Spacemonkey Project Context Engine",


    version:

      "0.1.0",


    contexts:

      contextHistory.length

  }

}



export {

  createProjectContext,

  getProjectContexts,

  getProjectContextStatus

}
