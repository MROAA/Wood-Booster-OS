import {
  runWatcherCycle,
  getGitSyncStatus
} from "./gitSyncWatcher.js"



const result =
  await runWatcherCycle()



console.log(
  "WATCHER RESULT"
)


console.log(
  JSON.stringify(
    result,
    null,
    2
  )
)



console.log(
  "STATUS"
)


console.log(
  JSON.stringify(
    getGitSyncStatus(),
    null,
    2
  )
)
