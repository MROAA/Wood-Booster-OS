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


  if(!rootPath){

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
    const directory of ROOT_DIRECTORIES
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



  await fs.writeFile(

    path.join(
      rootPath,
      "manifest.json"
    ),

    JSON.stringify(
      SPACEMONKEY_ROOT_MANIFEST,
      null,
      2
    ),

    "utf-8"

  )



  return {

    success:true,

    rootPath,

    directories:
      ROOT_DIRECTORIES

  }

}



async function validateRootFilesystem({
  rootPath
}){


  const missing=[]


  for(
    const directory of ROOT_DIRECTORIES
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

      missing.push(
        directory
      )

    }

  }



  return {

    valid:
      missing.length === 0,

    missing

  }

}



export {

  createRootFilesystem,

  validateRootFilesystem

}
