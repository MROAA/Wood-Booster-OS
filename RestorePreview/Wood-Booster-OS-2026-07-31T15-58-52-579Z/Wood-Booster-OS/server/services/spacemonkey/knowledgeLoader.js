/*
=====================================
SPACEMONKEY KNOWLEDGE LOADER V1

Vastuut:

- lukee Spacemonkey tietopankin
- lataa txt tiedostot
- muodostaa Core Contextin

Tämä ei:
- kutsu AI:ta
- käytä Prismaa
- muuta muistia

=====================================
*/


import fs from "fs/promises"
import path from "path"



const SPACEMONKEY_PATH =
  path.resolve(
    process.cwd(),
    "../Spacemonkey",
  )



async function loadTextFiles(
  directory,
){

  const files =
    await fs.readdir(
      directory,
      {
        recursive:
          true,
      },
    )


  const txtFiles =
    files.filter(
      file =>
        file.endsWith(".txt"),
    )


  const documents =
    []


  for (
    const file
    of txtFiles
  ){

    const fullPath =
      path.join(
        directory,
        file,
      )


    const content =
      await fs.readFile(
        fullPath,
        "utf-8",
      )


    documents.push({

      file,

      content:
        content.trim(),

    })

  }


  return documents

}



async function loadSpacemonkeyKnowledge(){

  const documents =
    await loadTextFiles(
      SPACEMONKEY_PATH,
    )


  return {

    success:
      true,


    source:
      "spacemonkey-database",


    path:
      SPACEMONKEY_PATH,


    count:
      documents.length,


    documents,

  }

}



export {

  loadSpacemonkeyKnowledge,

}
