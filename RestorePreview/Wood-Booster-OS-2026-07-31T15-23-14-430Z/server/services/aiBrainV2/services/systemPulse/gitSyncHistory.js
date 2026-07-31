/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GIT SYNC HISTORY

Vastuut:

- tallentaa Git Sync tapahtumat
- tarjoaa historian System Pulseen
- suodattaa turhat tarkistukset

=====================================
*/


const MAX_HISTORY =
  50





let prismaClient =
  null





function setGitSyncPrisma(prisma){

  prismaClient =
    prisma

}







async function addGitSyncEvent(event){


  if(
    !prismaClient
  ){

    return

  }





  if(
    event.type === "CHECK_OK"
  ){

    return

  }






  await prismaClient.gitSyncEvent.create({

    data: {

      type:
        event.type
        ||
        "SYNC_EVENT",


      status:
        event.status
        ||
        "unknown",


      repository:
        event.repository
        ||
        null,


      branch:
        event.branch
        ||
        null,


      commit:
        event.commit
        ||
        null,


      changedFiles:
        event.changedFiles
        ||
        0,


      message:
        event.message
        ||
        null

    }

  })


}







async function getGitSyncHistory(){


  if(
    !prismaClient
  ){

    return {

      total:0,

      events:[],

      checkedAt:
        new Date()
          .toISOString()

    }

  }






  const events =
    await prismaClient.gitSyncEvent.findMany({

      where: {

        NOT: {

          type:
            "CHECK_OK"

        }

      },


      orderBy: {

        createdAt:
          "desc"

      },


      take:
        MAX_HISTORY

    })






  return {

    total:
      events.length,


    events,


    checkedAt:
      new Date()
        .toISOString()

  }


}







export {

  setGitSyncPrisma,

  addGitSyncEvent,

  getGitSyncHistory,

}
