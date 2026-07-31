import {
  createSnapshot
} from "./snapshotService.js"



const result =
  await createSnapshot()



console.log(
  JSON.stringify(
    result,
    null,
    2
  )
)
