import fs from "fs/promises"
import path from "path"



async function saveSnapshotFile({

  directory,

  snapshot

}) {


  await fs.mkdir(

    directory,

    {
      recursive:true
    }

  )



  const filename =
    `snapshot-${Date.now()}.json`



  const filePath =
    path.join(
      directory,
      filename
    )



  await fs.writeFile(

    filePath,

    JSON.stringify(
      snapshot,
      null,
      2
    ),

    "utf-8"

  )



  return {

    filename,

    filePath,

    createdAt:
      new Date().toISOString()

  }

}





async function listSnapshots({

  directory

}) {


  try {


    const files =
      await fs.readdir(
        directory
      )



    return files

      .filter(

        file =>
          file.endsWith(".json")

      )

      .sort()

      .reverse()


  }


  catch {


    return []


  }


}





export {

  saveSnapshotFile,

  listSnapshots

}
