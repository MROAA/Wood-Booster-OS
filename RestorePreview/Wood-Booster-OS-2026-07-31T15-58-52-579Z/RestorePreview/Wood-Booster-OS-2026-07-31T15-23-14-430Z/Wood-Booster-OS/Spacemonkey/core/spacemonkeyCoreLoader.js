import fs from "fs"

import path from "path"

import {
  fileURLToPath,
} from "url"





const __filename =
  fileURLToPath(
    import.meta.url
  )


const __dirname =
  path.dirname(
    __filename
  )





const CORE_DIRECTORY =
  __dirname





const GODFILE_INDEX_PATH =

  path.join(
    CORE_DIRECTORY,
    "spacemonkeyGodFileIndex.json"
  )





const CORE_REGISTRY_PATH =

  path.join(
    CORE_DIRECTORY,
    "spacemonkeyCoreRegistry.json"
  )





const RUNTIME_CONFIG_PATH =

  path.join(
    CORE_DIRECTORY,
    "spacemonkeyRuntimeConfig.json"
  )





const loadHistory = []







function readJsonFile(filePath){


  if(
    !fs.existsSync(filePath)
  ){

    return null

  }





  const content =

    fs.readFileSync(
      filePath,
      "utf-8"
    )





  return JSON.parse(
    content
  )

}







function loadGodFileIndex(){

  return readJsonFile(
    GODFILE_INDEX_PATH
  )

}







function loadCoreRegistry(){

  return readJsonFile(
    CORE_REGISTRY_PATH
  )

}







function loadRuntimeConfig(){

  return readJsonFile(
    RUNTIME_CONFIG_PATH
  )

}







function loadSpacemonkeyCore(){


  const godFiles =

    loadGodFileIndex()



  const registry =

    loadCoreRegistry()



  const runtime =

    loadRuntimeConfig()





  const core = {


    system:

      "Spacemonkey Central Core",


    version:

      "1.0.0",


    godFiles,


    registry,


    runtime,


    loadedAt:

      new Date().toISOString()

  }





  loadHistory.push(
    core
  )





  return core

}







function getActiveModules(){


  const core =

    loadSpacemonkeyCore()



  return (

    core
      ?.registry
      ?.modules
      ?.filter(
        module =>
          module.enabled
      )

    ||

    []

  )

}







function getCoreStatus(){


  const core =

    loadSpacemonkeyCore()



  return {


    engine:

      "Spacemonkey Core Loader",


    version:

      core.version,


    status:

      "active",


    modules:

      core
        ?.registry
        ?.modules
        ?.length || 0,


    loadedAt:

      core.loadedAt

  }

}







function getCoreHistory(){

  return [

    ...loadHistory

  ]

}







export {

  loadSpacemonkeyCore,

  loadGodFileIndex,

  loadCoreRegistry,

  loadRuntimeConfig,

  getActiveModules,

  getCoreStatus,

  getCoreHistory

}
