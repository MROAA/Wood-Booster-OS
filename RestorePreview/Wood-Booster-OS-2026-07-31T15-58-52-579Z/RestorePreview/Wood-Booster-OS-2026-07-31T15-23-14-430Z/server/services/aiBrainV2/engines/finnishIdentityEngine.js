/*
=====================================
WOOD-BOOSTER AI BRAIN V2

FINNISH IDENTITY ENGINE V1

Vastuut:

- lataa suomalaisen AI-identiteetin
- yhdistää kieli-, kulttuuri-,
  huumori- ja työskentelykerrokset

Tämä EI:

- kutsu AI-mallia
- kirjoita tietokantaan
- muuta muistia

=====================================
*/


import fs from "fs/promises"
import path from "path"



const FINNISH_KNOWLEDGE_PATH =
  path.resolve(
    "server/ai-knowledge/finnish",
  )



const finnishIdentityFiles = [

  "finnish_language.txt",

  "finnish_culture.txt",

  "finnish_humor.txt",

  "finnish_workstyle.txt",

  "finnish_identity_bundle.txt",

]




async function loadFinnishIdentity(){

  const documents = []


  for (
    const file
    of finnishIdentityFiles
  ){

    try {

      const content =
        await fs.readFile(
          path.join(
            FINNISH_KNOWLEDGE_PATH,
            file,
          ),
          "utf8",
        )


      documents.push({

        file,

        content,

      })


    }

    catch(error){

      console.error(
        "Finnish identity load error:",
        file,
        error.message,
      )

    }

  }


  return {

    success:
      true,


    language:
      "fi",


    culture:
      "finnish",


    documents,


    documentCount:
      documents.length,

  }

}




function createFinnishIdentityContext(
  identity,
){

  if (
    !identity ||
    !Array.isArray(
      identity.documents,
    )
  ){

    return ""

  }


  return identity.documents

    .map(
      document =>

        [
          `SOURCE: ${document.file}`,

          document.content,

        ].join("\n")

    )

    .join("\n\n")

}




export {

  loadFinnishIdentity,

  createFinnishIdentityContext,

}
