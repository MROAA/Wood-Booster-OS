/*
=====================================
WOOD-BOOSTER AI PLATFORM

GODFILE LOADER V1

Vastuut:

- lukee Spacemonkey godfilet
- palauttaa niiden sisällön
- tarjoaa tiedostopohjaisen identiteettikerroksen

Ei:

- kutsu LLM:ää
- tee päätöksiä
- kirjoita tiedostoja

=====================================
*/


import fs from "fs/promises"
import path from "path"





const GODFILE_PATH =
  path.resolve(
    "Spacemonkey/godfiles"
  )





async function loadGodfiles(){


  const files = [

    "personality.godfile",

    "creator.godfile",

  ]



  const documents = []





  for(
    const file
    of files
  ){

    try {


      const content =
        await fs.readFile(

          path.join(
            GODFILE_PATH,
            file
          ),

          "utf8"

        )



      documents.push({

        file,

        content

      })


    }


    catch(error){


      console.error(

        "Godfile load error:",

        file,

        error.message

      )


    }


  }





  return {

    loaded:

      documents.length > 0,


    count:

      documents.length,


    documents

  }


}







function createGodfileContext(
  godfiles
){


  if(
    !godfiles ||
    !Array.isArray(
      godfiles.documents
    )
  ){

    return ""

  }





  return godfiles.documents

    .map(

      document =>

      [

        `SOURCE: ${document.file}`,

        document.content

      ]

      .join("\n")

    )

    .join("\n\n")


}







export {

  loadGodfiles,

  createGodfileContext

}
