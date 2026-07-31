/*
=====================================
WOOD-BOOSTER AI PLATFORM

CREATOR IDENTITY LOADER V1

Vastuut:

- lataa Creator Identity lähteet
- yhdistää GODFILE:t ja PDF:n
- ei rekisteröi provideria

=====================================
*/


import fs from "fs/promises"
import path from "path"


import {
  loadCreatorPDF,
} from "./pdfIdentityLoader.js"





const PERSONAL_PATH =
  path.resolve(
    "Spacemonkey/PERSONAL"
  )





const creatorFiles = [

  "GODFILE_001.txt",

  "GODFILE PERSONAL.txt",

  "GODFILE PERSONAL 2.txt",

  "GODFILE PERSONAL 3.txt",

  "GODFILE PERSBABA.txt",

  "GODFILE FINNISH LANGUAGE CORE.txt",

]






async function loadCreatorFiles(){

  const documents = []


  for(
    const file of creatorFiles
  ){

    try {

      const content =
        await fs.readFile(
          path.join(
            PERSONAL_PATH,
            file
          ),
          "utf8"
        )


      documents.push({

        source:
          file,

        content,

      })


    }
    catch(error){

      continue

    }

  }


  return documents

}






async function loadCreatorIdentity(){

  const files =
    await loadCreatorFiles()



  const pdf =
    await loadCreatorPDF()



  const sources = [
    ...files
  ]



  if(pdf.loaded){

    sources.push({

      source:
        pdf.source,

      content:
        pdf.content,

    })

  }





  const context =
    sources
      .map(
        item =>
          [
            `SOURCE: ${item.source}`,
            item.content
          ]
          .join("\n\n")
      )
      .join("\n\n")





  return {

    success:
      true,

    pdfLoaded:
      pdf.loaded,

    sourceCount:
      sources.length,

    context,

  }


}







function createCreatorIdentityContext(
  identity
){

  return identity?.context || ""

}







export {

  loadCreatorIdentity,

  createCreatorIdentityContext,

}
