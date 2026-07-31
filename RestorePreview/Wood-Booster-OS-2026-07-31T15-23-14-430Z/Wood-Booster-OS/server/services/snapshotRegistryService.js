import {
  readFile,
  writeFile,
} from "fs/promises"

import path from "path"



const REGISTRY_PATH =
  "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/data/snapshotRegistry.json"





async function readRegistry(){


  try{


    const data =
      await readFile(
        REGISTRY_PATH,
        "utf-8"
      )



    return JSON.parse(
      data
    )


  }
  catch(error){


    return {

      snapshots:[]

    }


  }


}







async function saveRegistry(registry){


  await writeFile(

    REGISTRY_PATH,

    JSON.stringify(
      registry,
      null,
      2
    )

  )


}







export async function addSnapshot(snapshot){


  const registry =
    await readRegistry()



  registry.snapshots.unshift(

    {

      id:
        Date.now(),


      ...snapshot

    }

  )



  await saveRegistry(
    registry
  )



  return registry

}







export async function getSnapshotRegistry(){


  const registry =
    await readRegistry()



  return registry.snapshots || []


}







export async function findSnapshot(file){


  const snapshots =
    await getSnapshotRegistry()



  return snapshots.find(

    snapshot =>
      snapshot.file === file

  ) || null


}
