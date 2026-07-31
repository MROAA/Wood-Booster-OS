import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


const SPACEMONKEY_PATH =
  path.join(
    __dirname,
    "spacemonkey"
  )


function readJsonFile(fileName){

  const filePath =
    path.join(
      SPACEMONKEY_PATH,
      fileName
    )


  if(!fs.existsSync(filePath)){

    throw new Error(
      `Spacemonkey file missing: ${fileName}`
    )

  }


  const content =
    fs.readFileSync(
      filePath,
      "utf-8"
    )


  return JSON.parse(content)

}



function readMarkdownFile(fileName){

  const filePath =
    path.join(
      SPACEMONKEY_PATH,
      fileName
    )


  if(!fs.existsSync(filePath)){

    throw new Error(
      `Spacemonkey document missing: ${fileName}`
    )

  }


  return fs.readFileSync(
    filePath,
    "utf-8"
  )

}



function loadSpacemonkeyIdentity(){


  const schema =
    readJsonFile(
      "32_spacemonkey_core_schema.json"
    )


  const loaderArchitecture =
    readJsonFile(
      "33_spacemonkey_loader_architecture.json"
    )


  const runtimeContract =
    readJsonFile(
      "34_spacemonkey_runtime_contract.json"
    )


  const initializationFlow =
    readMarkdownFile(
      "35_spacemonkey_core_initialization_flow.md"
    )


  return {


    schema,

    loaderArchitecture,

    runtimeContract,

    initializationFlow,


    loadedAt:
      new Date().toISOString()

  }


}



function createSpacemonkeyCore(){


  const identity =
    loadSpacemonkeyIdentity()



  return {


    id:
      "spacemonkey-core",


    name:
      "Spacemonkey",


    version:
      identity.schema
        .spacemonkey_core_schema
        .version,


    status:
      "READY",


    identity,


    capabilities:

      identity.schema
        .spacemonkey_core_schema
        .runtime_capabilities
        .enabled,


    initialized:
      true,


    getStatus(){

      return {

        name:this.name,

        version:this.version,

        status:this.status,

        initialized:this.initialized

      }

    }

  }


}



let spacemonkeyInstance = null



function getSpacemonkeyCore(){


  if(!spacemonkeyInstance){

    spacemonkeyInstance =
      createSpacemonkeyCore()

  }


  return spacemonkeyInstance

}



export {

  getSpacemonkeyCore,

  createSpacemonkeyCore,

  loadSpacemonkeyIdentity

}
