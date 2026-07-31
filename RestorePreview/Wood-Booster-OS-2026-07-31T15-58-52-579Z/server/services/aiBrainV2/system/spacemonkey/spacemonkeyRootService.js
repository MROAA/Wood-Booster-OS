import prisma from "../../../../prisma.js"



function getDatabase(
  prismaClient,
){
  return (
    prismaClient ||
    prisma
  )
}



/*
==================================================

SPACEMONKEY ROOT SERVICE

Spacemonkeyn pysyvä perusta.

Root EI ole normaali muisti.

Memory:
- oppiminen
- projektitieto
- keskustelut

Root:
- identiteetti
- syntyhistoria
- tärkeät päätökset
- järjestelmän perusta

==================================================
*/



export async function setRootValue({

  prismaClient,

  key,

  value,

  category = "system",

  importance = 5,

} = {}){


  const database =
    getDatabase(
      prismaClient,
    )


  if(
    !key ||
    !value
  ){

    return null

  }



  const existing =
    await database
      .spacemonkeyRoot
      .findUnique({

        where:{
          key,
        },

      })



  if(existing){

    return await database
      .spacemonkeyRoot
      .update({

        where:{
          key,
        },

        data:{

          value,

          category,

          importance,

        },

      })

  }



  return await database
    .spacemonkeyRoot
    .create({

      data:{

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

} = {}){


  const database =
    getDatabase(
      prismaClient,
    )


  if(!key){

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

} = {}){


  const database =
    getDatabase(
      prismaClient,
    )


  return await database
    .spacemonkeyRoot
    .findMany({

      orderBy:{

        importance:
          "desc",

      },

    })

}





export async function createGenesisRoot(){


  return await setRootValue({

    key:
      "genesis_date",


    value:
      "2026-07-26 23:14 - Spacemonkey syntyi",


    category:
      "identity",


    importance:
      10,

  })

}
