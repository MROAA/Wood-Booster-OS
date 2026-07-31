import prisma from "../../../../prisma.js"


function resolveDatabase(
  prismaClient,
) {

  return (
    prismaClient ||
    prisma
  )

}





export async function setRootValue({
  prismaClient,
  key,
  value,
  category = "system",
  importance = 5,
} = {}) {


  const database =
    resolveDatabase(
      prismaClient,
    )


  if(
    !database ||
    !key ||
    !value
  ){

    return null

  }



  return await database
    .spacemonkeyRoot
    .upsert({

      where:{
        key,
      },


      update:{

        value,

        category,

        importance,

      },


      create:{

        key,

        value,

        category,

        importance,

      },


    })

}





export async function getRootValue({
  prismaClient,
  key,
} = {}) {


  const database =
    resolveDatabase(
      prismaClient,
    )


  if(
    !database ||
    !key
  ){

    return null

  }


  return await database
    .spacemonkeyRoot
    .findUnique({

      where:{
        key,
      },

    })

}





export async function getRootDatabase({
  prismaClient,
} = {}) {


  const database =
    resolveDatabase(
      prismaClient,
    )


  if(!database){

    return []

  }



  return await database
    .spacemonkeyRoot
    .findMany({

      orderBy:{
        createdAt:"asc",
      },

    })

}





export async function deleteRootValue({
  prismaClient,
  key,
} = {}) {


  const database =
    resolveDatabase(
      prismaClient,
    )


  if(
    !database ||
    !key
  ){

    return false

  }



  await database
    .spacemonkeyRoot
    .delete({

      where:{
        key,
      },

    })


  return true

}
