import fs from "fs/promises"
import path from "path"



async function restoreSnapshot({

  snapshotDirectory,

  filename

}) {


  if(
    !snapshotDirectory ||
    !filename
  ){

    throw new Error(
      "Snapshot information missing"
    )

  }



  const filePath =
    path.join(
      snapshotDirectory,
      filename
    )



  const content =
    await fs.readFile(
      filePath,
      "utf-8"
    )



  const snapshot =
    JSON.parse(
      content
    )



  return {

    success:true,

    restoredAt:
      new Date().toISOString(),


    snapshot

  }

}





async function restoreLatestSnapshot({

  snapshotDirectory

}) {


  const files =
    await fs.readdir(
      snapshotDirectory
    )



  const snapshots =
    files

      .filter(
        file =>
          file.endsWith(".json")
      )

      .sort()

      .reverse()



  if(
    snapshots.length === 0
  ){

    return {

      success:false,

      reason:
        "No snapshots found"

    }

  }



  return restoreSnapshot({

    snapshotDirectory,

    filename:
      snapshots[0]

  })


}





export {

  restoreSnapshot,

  restoreLatestSnapshot

}
