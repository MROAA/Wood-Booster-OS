import fs from "fs"



const readHistory = []



function readCodeFile({

  filePath

}) {


  try {


    const sourceCode =

      fs.readFileSync(
        filePath,
        "utf-8"
      )


    const result = {

      filePath,

      exists:
        true,

      sourceCode,

      size:
        sourceCode.length,

      createdAt:
        new Date().toISOString()

    }



    readHistory.push(result)



    return result


  }


  catch(error){


    const result = {

      filePath,

      exists:
        false,

      sourceCode:
        null,

      error:
        error.message,

      createdAt:
        new Date().toISOString()

    }



    readHistory.push(result)



    return result

  }

}



function getCodeReaderStatus(){


  return {

    engine:
      "Spacemonkey Code Reader",

    version:
      "0.1.0",

    reads:
      readHistory.length

  }

}



export {

  readCodeFile,

  getCodeReaderStatus

}
