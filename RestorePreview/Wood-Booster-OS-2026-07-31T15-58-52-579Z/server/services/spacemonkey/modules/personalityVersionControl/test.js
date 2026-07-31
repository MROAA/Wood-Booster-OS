import {
  createVersion,
  getVersions,
  getLatestVersion,
  rollbackVersion,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY VERSION CONTROL ==="
)



const version =
  createVersion({

    version:
      "1.0.0",

    change:
      "Added friendly communication rules.",

    reason:
      "Improve operator interaction.",

    approvedBy:
      "creator",

  })



console.log(
  version
)



console.log(
  "\n=== VERSION HISTORY ==="
)



console.log(
  getVersions()
)



console.log(
  "\n=== LATEST VERSION ==="
)



console.log(
  getLatestVersion()
)



console.log(
  "\n=== ROLLBACK TEST ==="
)



console.log(
  rollbackVersion(
    version.id
  )
)
