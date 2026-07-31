import {
  saveSnapshotFile,
  listSnapshots
} from "./snapshotStorage.js"





async function createSnapshot({

  snapshotDirectory,

  state

}) {


  const snapshot = {


    system:
      "Spacemonkey Snapshot",


    version:
      "1.0.0",


    createdAt:
      new Date().toISOString(),



    state


  }



  return await saveSnapshotFile({

    directory:
      snapshotDirectory,


    snapshot

  })


}





async function getSnapshots({

  snapshotDirectory

}) {


  return await listSnapshots({

    directory:
      snapshotDirectory

  })


}





export {

  createSnapshot,

  getSnapshots

}
