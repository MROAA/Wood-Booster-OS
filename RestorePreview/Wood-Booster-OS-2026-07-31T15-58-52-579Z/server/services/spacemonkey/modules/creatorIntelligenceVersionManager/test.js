import {
  createVersion,
  approveVersion,
  rollbackVersion,
  getVersionHistory,
  getAllVersions,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE VERSION MANAGER ==="
)



const first =
  createVersion({

    knowledgeId:
      "modular-development",


    content:
      "Build systems using isolated modules.",


    reason:
      "Initial creator principle.",


    createdBy:
      "creator",

  })



console.log(
  first
)



console.log(
  "\n=== APPROVE ==="
)



console.log(
  approveVersion(
    first.id
  )
)



const second =
  createVersion({

    knowledgeId:
      "modular-development",


    content:
      "Build systems using isolated secure modules.",


    reason:
      "Added security principle.",


    createdBy:
      "reflection-engine",

  })



console.log(
  second
)



console.log(
  "\n=== HISTORY ==="
)



console.log(
  getVersionHistory(
    "modular-development"
  )
)



console.log(
  "\n=== ROLLBACK ==="
)



console.log(
  rollbackVersion(
    "modular-development"
  )
)



console.log(
  "\n=== ALL ==="
)



console.log(
  getAllVersions()
)
