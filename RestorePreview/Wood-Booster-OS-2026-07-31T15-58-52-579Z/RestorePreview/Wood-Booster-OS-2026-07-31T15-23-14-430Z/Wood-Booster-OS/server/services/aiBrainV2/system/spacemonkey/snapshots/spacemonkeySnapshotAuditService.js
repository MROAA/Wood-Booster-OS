import prisma from "../../../../../prisma.js"



function getDatabase(prismaClient){

  return prismaClient || prisma

}





export async function createSnapshotAuditRecord({

  prismaClient,

  event = "snapshot_created",

  module = "Snapshot System",

  changeType = "unknown",

  risk = "unknown",

  snapshot = null,

  status = "completed",

  message = null,

} = {}){


  const database =
    getDatabase(
      prismaClient
    )



  try{


    return await database
      .spacemonkeySnapshotAudit
      .create({

        data:{

          event,

          module,

          changeType,

          risk,

          snapshot,

          status,

          message:
            message ||
            `Snapshot audit event: ${event}`

        }

      })


  }

  catch(error){


    console.error(
      "CREATE SNAPSHOT AUDIT ERROR:",
      error.message
    )


    return null

  }


}







export async function getSnapshotAuditRecords({

  prismaClient,

} = {}){


  const database =
    getDatabase(
      prismaClient
    )



  try{


    return await database
      .spacemonkeySnapshotAudit
      .findMany({

        orderBy:{

          createdAt:
            "desc"

        }

      })


  }

  catch(error){


    console.error(
      "GET SNAPSHOT AUDIT ERROR:",
      error.message
    )


    return []

  }


}







export async function getLatestSnapshotAuditRecord({

  prismaClient,

} = {}){


  const database =
    getDatabase(
      prismaClient
    )



  try{


    return await database
      .spacemonkeySnapshotAudit
      .findFirst({

        orderBy:{

          createdAt:
            "desc"

        }

      })


  }

  catch(error){


    console.error(
      "GET LATEST SNAPSHOT AUDIT ERROR:",
      error.message
    )


    return null

  }


}
