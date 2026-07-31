import fs from "fs"
import path from "path"



const scanHistory = []



function scanProject({

  projectPath

}) {


  const result = {


    projectPath:

      projectPath || null,


    files: [],


    folders: [],


    createdAt:

      new Date().toISOString()

  }



  if(!projectPath){

    scanHistory.push(result)

    return result

  }



  try {


    scanDirectory({

      directory:

        projectPath,


      result

    })


  }

  catch(error){


    result.error =

      error.message

  }



  scanHistory.push(

    result

  )



  return result

}





function scanDirectory({

  directory,

  result

}) {


  const entries =

    fs.readdirSync(

      directory,

      {

        withFileTypes:true

      }

    )



  for(

    const entry

    of entries

  ){


    const fullPath =

      path.join(

        directory,

        entry.name

      )



    if(

      entry.isDirectory()

    ){


      result.folders.push(

        fullPath

      )


      scanDirectory({

        directory:

          fullPath,


        result

      })


    }


    else {


      result.files.push(

        {

          path:

            fullPath,


          type:

            detectFileType(

              entry.name

            )

        }

      )

    }

  }

}





function detectFileType(name){


  if(

    name.endsWith(".jsx")

  ){

    return "react"

  }



  if(

    name.endsWith(".js")

  ){

    return "javascript"

  }



  if(

    name.endsWith(".json")

  ){

    return "json"

  }



  if(

    name.endsWith(".css")

  ){

    return "style"

  }



  return "other"

}





function getScanHistory(){


  return [

    ...scanHistory

  ]

}





function getProjectScannerStatus(){


  return {


    engine:

      "Spacemonkey Project Scanner Engine",


    version:

      "0.1.0",


    scans:

      scanHistory.length

  }

}



export {

  scanProject,

  getScanHistory,

  getProjectScannerStatus

}
