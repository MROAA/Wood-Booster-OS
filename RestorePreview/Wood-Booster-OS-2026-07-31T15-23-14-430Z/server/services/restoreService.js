import { execFile } from "child_process"
import path from "path"



const BACKUP_DIR =
  "/home/marc/Wood-Booster-AI/backups"



const PROJECT_DIR =
  "/home/marc/Wood-Booster-AI"





export function restoreSnapshot(file){


  return new Promise(
    (
      resolve,
      reject
    )=>{


      if(!file){

        reject({

          success:false,

          error:
            "Snapshot file missing"

        })

        return

      }



      const snapshotPath =
        path.join(
          BACKUP_DIR,
          file
        )



      execFile(

        "tar",

        [
          "-tzf",
          snapshotPath
        ],

        (
          error,
          stdout,
          stderr
        )=>{


          if(error){

            reject({

              success:false,

              error:
                stderr ||
                error.message

            })

            return

          }



          resolve({

            success:true,

            message:
              "Restore validation successful",

            snapshot:
              file,

            preview:
              stdout
                .split("\n")
                .slice(0,10)

          })


        }

      )


    }
  )


}
