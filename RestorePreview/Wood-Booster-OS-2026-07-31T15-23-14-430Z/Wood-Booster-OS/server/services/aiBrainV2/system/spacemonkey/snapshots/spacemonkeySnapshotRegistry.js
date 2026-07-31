import prisma from "../../../../../prisma.js"


function getDatabase(prismaClient){

  return prismaClient || prisma

}



export async function registerSnapshot({

  prismaClient,

  filename,

  path,

  version = "1.0.0",

  description = null,

} = {}){


  const database =
    getDatabase(
      prismaClient
    )


  if(
    !filename ||
    !path
  ){

    return {

      success:false,

      error:"filename and path required"

    }

  }


  try{


    const snapshot =
      await database
        .spacemonkeySnapshot
        .create({

          data:{

            filename,

            path,

            version,

            description,

            status:"created"

          }

        })


    return {

      success:true,

      snapshot

    }


  }

  catch(error){

    console.error(
      "SNAPSHOT REGISTER ERROR:",
      error.message
    )


    return {

      success:false,

      error:error.message

    }

  }

}





export async function getSnapshots({

  prismaClient,

} = {}){


  const database =
    getDatabase(
      prismaClient
    )


  return await database
    .spacemonkeySnapshot
    .findMany({

      orderBy:{

        createdAt:"desc"

      }

    })

}





export async function getLatestSnapshot({

  prismaClient,

} = {}){


  const database =
    getDatabase(
      prismaClient
    )


  return await database
    .spacemonkeySnapshot
    .findFirst({

      orderBy:{

        createdAt:"desc"

      }

    })

}
