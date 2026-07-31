import fs from "fs/promises"
import path from "path"

import {
  SPACEMONKEY_ROOT_MANIFEST
} from "./spacemonkeyRootManifest.js"



const ROOT_DIRECTORIES = [

  "identity",

  "memory",

  "knowledge",

  "runtime",

  "evolution",

  "security",

  "logs"

]



async function createRootFilesystem({
  rootPath
}) {


  if(
    !rootPath
  ){

    throw new Error(
      "Root path required"
    )

  }



  await fs.mkdir(
    rootPath,
    {
      recursive:true
    }
  )



  for(
    const directory
    of ROOT_DIRECTORIES
  ){

    await fs.mkdir(
      path.join(
        rootPath,
        directory
      ),
      {
        recursive:true
      }
    )

  }



  await writeManifest({
    rootPath
  })



  return {

    success:true,

    rootPath,

    directories:
      ROOT_DIRECTORIES,

    manifest:
      SPACEMONKEY_ROOT_MANIFEST

  }


}





async function writeManifest({
  rootPath
}) {


  const file = path.join(
    rootPath,
    "manifest.json"
  )


  await fs.writeFile(
    file,
    JSON.stringify(
      SPACEMONKEY_ROOT_MANIFEST,
      null,
      2
    ),
    "utf-8"
  )


}





async function validateRootFilesystem({
  rootPath
}) {


  const result = {


    valid:true,


    missing:[]

  }



  for(
    const directory
    of ROOT_DIRECTORIES
  ){

    try {

      await fs.access(
        path.join(
          rootPath,
          directory
        )
      )

    }

    catch {

      result.valid=false

      result.missing.push(
        directory
      )

    }

  }



  return result

}





export {

  createRootFilesystem,

  validateRootFilesystem,

  ROOT_DIRECTORIES

}