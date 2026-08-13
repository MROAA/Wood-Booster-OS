import {
  createBackup,
  restoreBackup,
  verifyBackup,
  getBackups,
  getLatestBackup,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE BACKUP RECOVERY ==="
)



const backup =
  createBackup({

    source:
      "creator-knowledge-vault",


    reason:
      "Create recovery point before evolution.",


    data:

      {

        principles:

          [
            "Build modular systems.",
            "Protect stable foundations.",
          ],


        version:
          "1.0.0",

      },

  })



console.log(
  "\n=== BACKUP ==="
)



console.log(
  backup
)



console.log(
  "\n=== VERIFY ==="
)



console.log(
  verifyBackup(
    backup.id
  )
)



console.log(
  "\n=== RESTORE ==="
)



console.log(
  restoreBackup(
    backup.id
  )
)



console.log(
  "\n=== ALL BACKUPS ==="
)



console.log(
  getBackups()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestBackup()
)
