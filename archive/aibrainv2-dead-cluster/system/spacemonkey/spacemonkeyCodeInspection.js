import fs from "fs"
import path from "path"


const inspectionHistory = []



function inspectCodeFile({

  filePath

}) {


  const result = {

    filePath,

    exists:false,

    language:null,

    size:0,

    analysisReady:false,

    createdAt:
      new Date().toISOString()

  }



  if(!filePath){

    inspectionHistory.push(result)

    return result

  }



  const projectRoot =

    process.cwd()



  const absolutePath =

    path.join(

      projectRoot,

      "..",

      filePath

    )



  try {


    const stats =

      fs.statSync(

        absolutePath

      )



    result.exists =
      true



    result.size =
      stats.size



    result.language =
      detectLanguage(filePath)



    result.analysisReady =
      true



  }

  catch(error){


    result.exists =
      false


  }



  inspectionHistory.push(

    result

  )



  return result

}



function detectLanguage(filePath){


  if(
    filePath.endsWith(".jsx")
  ){

    return "javascript-react"

  }


  if(
    filePath.endsWith(".js")
  ){

    return "javascript"

  }


  if(
    filePath.endsWith(".css")
  ){

    return "css"

  }


  return "unknown"

}



function getCodeInspectionStatus(){

  return {

    engine:
      "Spacemonkey Code Inspection Engine",

    version:
      "0.1.0",

    inspections:
      inspectionHistory.length

  }

}



export {

  inspectCodeFile,

  getCodeInspectionStatus

}
