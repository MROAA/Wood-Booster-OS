import {
  execFile,
} from "child_process"

import {
  readdir,
  writeFile,
  stat,
} from "fs/promises"

import path from "path"

import {
  addSnapshot,
} from "./snapshotRegistryService.js"

import {
  addSystemActivity,
} from "./systemActivityService.js"



const BACKUP_SCRIPT =
"/home/marc/Wood-Booster-AI/backup-system/backup.sh"



const BACKUP_DIR =
"/home/marc/Wood-Booster-AI/backups"



const VERSION =
"v0.1.0-mvp"



function execFileAsync(){

return new Promise(
(
resolve,
reject,
)=>{


execFile(

  BACKUP_SCRIPT,

  [],


  {
    timeout:
      300000,

    maxBuffer:
      1024 * 1024 * 100,
  },


  (
    error,
    stdout,
    stderr,
  )=>{


    if(error){

      reject({

        success:false,

        error:
          stderr ||
          error.message,


        stdout,

      })


      return

    }


    resolve({

      stdout,

      stderr,

    })


  },

)


}

)

}



export async function createSnapshot(){

try {


const result =
  await execFileAsync()



console.log(
"[BackupService] backup output:",
result.stdout,
)



const output =
(
result.stdout || ""
)



const lines =
output
.trim()
.split("\n")
.filter(Boolean)



let backupFile =
lines.find(
line =>
line.includes(
BACKUP_DIR
)
)



if(!backupFile){

const files =
await readdir(
BACKUP_DIR,
)



const snapshots =
files
.filter(
file =>
file.startsWith(
"snapshot_"
)
&&
file.endsWith(
".tar.gz"
)
)
.sort()
.reverse()



if(
snapshots.length
){

backupFile =
path.join(
BACKUP_DIR,
snapshots[0],
)

}

}



if(!backupFile){


throw new Error(
"Backup file not found after snapshot creation"
)

}



const fileName =
path.basename(
backupFile,
)



const fileInfo =
await stat(
backupFile,
)



const metadata = {


name:
"Manual System Snapshot",



version:
VERSION,



created:
new Date()
.toISOString(),



type:
"manual",



status:
"SAFE",



file:
fileName,



size:
`${Math.round(
fileInfo.size / 1024 / 1024
)} MB`

}



const metadataPath =
backupFile.replace(
".tar.gz",
".json",
)



await writeFile(

metadataPath,

JSON.stringify(
metadata,
null,
2,
)

)



await addSnapshot(
metadata,
)



await addSystemActivity({

type:
"SNAPSHOT_CREATED",


file:
fileName,


status:
"SUCCESS",


version:
VERSION,

})



return {

success:true,

file:
backupFile,

metadata,

}



}

catch(error){


throw {

success:false,

error:
error.message ||
String(error),

}

}

}





export async function getSnapshots(){

const files =
await readdir(
BACKUP_DIR,
)



return files

.filter(
file =>
file.startsWith(
"snapshot_"
)
&&
file.endsWith(
".tar.gz"
)
)

.sort()

.reverse()

.map(
(
file,
index,
)=>({


id:
index + 1,


name:
"System Snapshot",


file,


path:
path.join(
BACKUP_DIR,
file,
),


status:
"SAFE",

})

)

}
