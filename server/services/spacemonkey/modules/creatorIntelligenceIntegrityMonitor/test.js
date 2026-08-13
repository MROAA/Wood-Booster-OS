import {
  createIntegrityCheck,
  compareVersions,
  getIntegrityChecks,
  getIntegrityStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE INTEGRITY MONITOR ==="
)



const data = {

  principle:
    "Build modular systems.",

  version:
    "1.0.0",

}



const check =
  createIntegrityCheck({

    source:
      "creator-knowledge-vault",


    data,

  })



console.log(
  "\n=== CHECK ==="
)



console.log(
  check
)



console.log(
  "\n=== VERSION COMPARISON ==="
)



console.log(
  compareVersions({

    current:

      {
        version:
          "1.1.0",
      },


    previous:

      {
        version:
          "1.0.0",
      },

  })
)



console.log(
  "\n=== STATUS ==="
)



console.log(
  getIntegrityStatus()
)



console.log(
  "\n=== HISTORY ==="
)



console.log(
  getIntegrityChecks()
)
