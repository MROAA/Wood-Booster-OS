import fs from "fs/promises"
import path from "path"

import {
  recordActivity,
} from "./spacemonkeyActivityFeedEngine.js"


const writeHistory = []





async function createBackup({

  filePath,

  prisma

}) {


  try {


    const absolutePath =
      path.resolve(filePath)


    const content =
      await fs.readFile(
        absolutePath,
        "utf8"
      )



    const backupDir =
      path.join(
        path.dirname(absolutePath),
        ".spacemonkey-backups"
      )



    await fs.mkdir(

      backupDir,

      {
        recursive:true
      }

    )



    const backupPath =
      path.join(
        backupDir,
        `${path.basename(filePath)}.${Date.now()}.bak`
      )



    await fs.writeFile(

      backupPath,

      content,

      "utf8"

    )



    await recordActivity({

      prisma,

      type:
        "backup_created",

      module:
        "Code Writer",

      status:
        "completed",

      message:
        `Backup created for ${filePath}`,

      metadata:
        {
          backupPath
        }

    })



    return {

      success:true,

      backupPath

    }


  }

  catch(error){


    return {

      success:false,

      error:error.message

    }

  }

}







function prepareCodeWrite({

  filePath,

  newContent,

  approval

}) {


  const result = {


    status:
      "prepared",


    approved:
      approval?.approved === true,


    filePath,


    contentReady:
      Boolean(newContent),


    nextStep:
      approval?.approved === true

        ? "execute_write"

        : "await_execution",


    createdAt:
      new Date().toISOString()

  }


  writeHistory.push(result)


  return result

}







async function writeCodeChange({

  prisma,

  filePath,

  content,

  mode = "dry_run"

}) {


  if(mode === "dry_run"){


    const result = {


      status:
        "prepared",


      mode,


      filePath,


      contentReady:
        Boolean(content),


      contentSize:
        content?.length || 0,


      createdAt:
        new Date().toISOString()

    }


    writeHistory.push(result)


    return result

  }







  await recordActivity({

    prisma,

    type:
      "write_started",

    module:
      "Code Writer",

    status:
      "started",

    message:
      `Writing ${filePath}`

  })







  const backup =

    await createBackup({

      filePath,

      prisma

    })







  if(!backup.success){


    const failed = {


      status:
        "failed",


      reason:
        "Backup failed",


      error:
        backup.error

    }



    await recordActivity({

      prisma,

      type:
        "write_failed",

      module:
        "Code Writer",

      status:
        "failed",

      message:
        `Backup failed for ${filePath}`,

      metadata:
        failed

    })



    return failed

  }







  await fs.writeFile(

    path.resolve(filePath),

    content,

    "utf8"

  )







  const result = {


    status:
      "written",


    mode,


    filePath,


    backup:
      backup.backupPath,


    contentSize:
      content.length,


    createdAt:
      new Date().toISOString()

  }







  await recordActivity({

    prisma,

    type:
      "write_completed",

    module:
      "Code Writer",

    status:
      "completed",

    message:
      `Write completed for ${filePath}`,

    metadata:
      result

  })







  writeHistory.push(result)


  return result

}







function getWriteHistory(){

  return [

    ...writeHistory

  ]

}







function getCodeWriterStatus(){


  return {


    engine:
      "Spacemonkey Code Writer Engine",


    version:
      "0.6.0",


    writes:
      writeHistory.length,


    mode:
      "safe_write"

  }

}







export {

  prepareCodeWrite,

  writeCodeChange,

  getWriteHistory,

  getCodeWriterStatus

}
