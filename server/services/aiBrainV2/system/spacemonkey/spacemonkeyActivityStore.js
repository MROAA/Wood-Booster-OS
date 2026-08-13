async function saveSpacemonkeyActivity({

  prisma,

  type,

  module = "spacemonkey",

  status = "active",

  message,

  metadata = null,

}) {


  if(!prisma){

    return {

      success:false,

      error:
        "Prisma client missing"

    }

  }





  const activity =

    await prisma.spacemonkeyActivity.create({

      data: {

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

    success:true,

    activity

  }

}







async function getRecentSpacemonkeyActivities({

  prisma,

} = {}) {



  if(!prisma){

    return []

  }





  return prisma.spacemonkeyActivity.findMany({

    orderBy: {

      createdAt:
        "desc"

    },

    take:

      20

  })

}







export {

  saveSpacemonkeyActivity,

  getRecentSpacemonkeyActivities

}
