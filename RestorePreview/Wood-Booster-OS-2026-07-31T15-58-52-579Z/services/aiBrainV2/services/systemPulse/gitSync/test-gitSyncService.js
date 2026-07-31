import {
  checkGitSync,
  getGitSyncStatus
} from "./gitSyncService.js"



const result =
  await checkGitSync()



console.log(
  "CHECK RESULT"
)


console.log(
  JSON.stringify(
    result,
    null,
    2
  )
)



console.log(
  "CURRENT STATUS"
)


console.log(
  JSON.stringify(
    getGitSyncStatus(),
    null,
    2
  )
)
