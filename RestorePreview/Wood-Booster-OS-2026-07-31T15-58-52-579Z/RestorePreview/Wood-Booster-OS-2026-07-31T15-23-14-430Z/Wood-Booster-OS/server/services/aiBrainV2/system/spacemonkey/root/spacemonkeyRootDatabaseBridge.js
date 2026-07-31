import {
  getRootDatabase
} from "../spacemonkeyRootService.js"



import {
  createRootFilesystem
} from "./spacemonkeyRootFilesystemEngine.js"



import {
  SPACEMONKEY_ROOT_MANIFEST
} from "./spacemonkeyRootManifest.js"





async function initializeSpacemonkeyRoot({

  rootPath

}) {


  const databaseRoots =
    await getRootDatabase()



  const filesystem =
    await createRootFilesystem({

      rootPath

    })



  return {


    system:
      "Spacemonkey Root Database Bridge",


    version:
      "1.0.0",


    status:
      "initialized",



    identity:
      SPACEMONKEY_ROOT_MANIFEST,



    database: {

      roots:
        databaseRoots,

      count:
        databaseRoots.length

    },



    filesystem



  }


}





async function getRootStatus({

  rootPath

}) {


  const databaseRoots =
    await getRootDatabase()



  return {


    status:
      "active",


    database:

    {

      count:
        databaseRoots.length

    },


    filesystem:

    {

      path:
        rootPath

    },


    identity:

      SPACEMONKEY_ROOT_MANIFEST.system


  }


}





export {

  initializeSpacemonkeyRoot,

  getRootStatus

}
