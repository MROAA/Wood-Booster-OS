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

import {
  fileURLToPath,
} from "url"



/*
path.resolve("server/ai-knowledge/finnish") resolves relative to
process.cwd(), not to this file's own location - it only worked by
coincidence because the server always happens to be launched from
the repo root today. Same class of bug fixed in
systemActivityService.js/snapshotRegistryService.js - resolve
relative to this file instead.
*/
const currentFile =
  fileURLToPath(
    import.meta.url,
  )

const currentDirectory =
  path.dirname(
    currentFile,
  )

const FINNISH_KNOWLEDGE_PATH =
  path.resolve(
    currentDirectory,
    "../../../ai-knowledge/finnish",
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
