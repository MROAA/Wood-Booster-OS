const activityHistory = []



async function recordActivity({

  prisma,

  type,

  module,

  status,

  message,

  metadata

}) {


  const activity = {


    type:

      type || "unknown",


    module:

      module || "Spacemonkey",


    status:

      status || "completed",


    message:

      message || null,


    metadata:

      metadata
        ? JSON.stringify(metadata)
        : null

  }



  if(prisma){

    const saved =

      await prisma.spacemonkeyActivity.create({

        data: activity

      })


    return saved

  }



  const fallback = {


    id:

      `activity-${Date.now()}`,

    ...activity,


    createdAt:

      new Date().toISOString()

  }



  activityHistory.push(

    fallback

  )



  return fallback

}





async function getActivityFeed({

  prisma

}){


  if(prisma){

    return prisma.spacemonkeyActivity.findMany({

      orderBy:

      {

        createdAt:

          "desc"

      }

    })

  }



  return [

    ...activityHistory

  ].reverse()

}





async function getRecentActivities({

  prisma,

  limit = 10

}){


  if(prisma){

    return prisma.spacemonkeyActivity.findMany({

      orderBy:

      {

        createdAt:

          "desc"

      },


      take:

        limit

    })

  }



  return [

    ...activityHistory

  ]

    .reverse()

    .slice(

      0,

      limit

    )

}





async function clearActivityFeed({

  prisma

}){


  if(prisma){

    await prisma.spacemonkeyActivity.deleteMany()


    return {

      cleared:true

    }

  }



  activityHistory.length = 0



  return {

    cleared:true

  }

}





function getActivityFeedStatus(){


  return {


    engine:

      "Spacemonkey Activity Feed Engine",


    version:

      "0.2.0",


    storage:

      "Prisma Persistent Storage"

  }

}



export {

  recordActivity,

  getActivityFeed,

  getRecentActivities,

  clearActivityFeed,

  getActivityFeedStatus

}
