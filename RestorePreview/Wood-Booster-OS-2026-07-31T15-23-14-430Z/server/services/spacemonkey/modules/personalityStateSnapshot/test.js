import {
  createSnapshot,
  getSnapshots,
  getLatestSnapshot,
  restoreSnapshot,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY STATE SNAPSHOT ==="
)



const snapshot =
  createSnapshot({

    version:
      "1.0.0",

    traits:

      [
        "friendly",
        "polite",
        "patient",
      ],


    activeRules:

      [
        "friendly-character",
        "humor-behavior",
        "respect-priority",
      ],


    memoryState:
      "active",


    safetyState:
      "protected",

  })



console.log(
  snapshot
)



console.log(
  "\n=== ALL SNAPSHOTS ==="
)



console.log(
  getSnapshots()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestSnapshot()
)



console.log(
  "\n=== RESTORE ==="
)



console.log(
  restoreSnapshot(
    snapshot.id
  )
)
