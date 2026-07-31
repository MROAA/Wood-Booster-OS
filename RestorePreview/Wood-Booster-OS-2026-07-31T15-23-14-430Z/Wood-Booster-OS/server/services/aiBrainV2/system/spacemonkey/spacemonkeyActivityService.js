/*
==================================================

SPACEMONKEY ACTIVITY SERVICE

Tallentaa Spacemonkeyn toimintohistorian.

Vastuu:

- Luo activity tapahtumia
- Lukee viimeisimmät tapahtumat
- Tarjoaa tilan Corelle

==================================================
*/



async function createActivity({

  prisma,

  type,

  module,

  status = "completed",

  message,

  metadata = null

}){


  if(!prisma){

    return {

      created:false,

      reason:
        "Database connection missing."

    }

  }



  const activity =

    await prisma.spacemonkeyActivity.create({

      data:{

        type,

        module,

        status,

        message,

        metadata:
          metadata
            ? JSON.stringify(metadata)
            : null

      }

    })



  return {

    created:true,

    activity

  }

}







async function getActivityHistory({

  prisma,

  limit = 20

} = {}){


  if(!prisma){

    return []

  }



  return await prisma.spacemonkeyActivity.findMany({

    orderBy:{

      createdAt:
        "desc"

    },

    take:
      limit

  })

}







async function getActivityStatus({

  prisma

} = {}){


  const count =

    await prisma.spacemonkeyActivity.count()



  return {

    engine:
      "Spacemonkey Activity Engine",


    version:
      "1.0.0",


    events:
      count

  }

}







export {

  createActivity,

  getActivityHistory,

  getActivityStatus

}
