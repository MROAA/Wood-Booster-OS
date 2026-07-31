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





const GODFILE_INDEX_PATH =

  path.join(

    __dirname,

    "spacemonkeyGodFileIndex.json"

  )





const godFileHistory = []







function loadGodFileIndex(){


  if(

    !fs.existsSync(

      GODFILE_INDEX_PATH

    )

  ){

    return null

  }





  const content =

    fs.readFileSync(

      GODFILE_INDEX_PATH,

      "utf-8"

    )





  return JSON.parse(

    content

  )

}







function getDomains(){


  const index =

    loadGodFileIndex()



  if(

    !index ||

    !index.domains

  ){

    return []

  }





  return Object.keys(

    index.domains

  )

}







function getDomain(domainName){


  const index =

    loadGodFileIndex()



  if(

    !index ||

    !index.domains ||

    !index.domains[domainName]

  ){

    return null

  }





  return {

    name:

      domainName,


    ...index.domains[domainName]

  }

}







function getIdentityGodFiles(){


  return getDomain(

    "identity"

  )

}







function getValuesGodFiles(){


  return getDomain(

    "values"

  )

}







function getCommunicationGodFiles(){


  return getDomain(

    "communication"

  )

}







function getCoreGodFileState(){


  const index =

    loadGodFileIndex()





  const result = {


    system:

      index?.system

      ||

      "Unknown",



    version:

      index?.version

      ||

      null,



    priorityOrder:

      index?.priorityOrder

      ||

      [],



    domains:

      getDomains(),



    rules:

      index?.rules

      ||

      {},



    loadedAt:

      new Date().toISOString()

  }





  godFileHistory.push(

    result

  )





  return result

}







function getGodFileStatus(){


  return {


    engine:

      "Spacemonkey GodFile Bridge",


    version:

      "1.0.0",


    indexExists:

      fs.existsSync(

        GODFILE_INDEX_PATH

      ),


    requests:

      godFileHistory.length

  }

}







function getGodFileHistory(){


  return [

    ...godFileHistory

  ]

}







export {

  loadGodFileIndex,

  getDomains,

  getDomain,

  getIdentityGodFiles,

  getValuesGodFiles,

  getCommunicationGodFiles,

  getCoreGodFileState,

  getGodFileStatus,

  getGodFileHistory

}
