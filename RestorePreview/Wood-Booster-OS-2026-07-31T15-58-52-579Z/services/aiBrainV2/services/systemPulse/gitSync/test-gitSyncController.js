import {
  runGitSync
} from "./gitSyncController.js"


const result =
  await runGitSync()


console.log(
  JSON.stringify(
    result,
    null,
    2
  )
)
