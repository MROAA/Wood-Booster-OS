const approvalHistory = []



async function evaluateCodeChangeApproval({

  prisma,

  changePlan

}) {


  const approval = {

    approved:false,

    status:"needs_review",

    risk:
      calculateRisk(changePlan),

    filePath:
      changePlan?.filePath || null,

    instruction:
      changePlan?.instruction || null,

    changePlan:
      JSON.stringify(changePlan || {}),

    reasons:
      JSON.stringify([
        "Muutos vaatii käyttäjän hyväksynnän.",
        "Nykyinen tiedosto pitää säilyttää ennen muutosta.",
        "Muutokset tehdään vasta suunnitelman tarkistamisen jälkeen."
      ]),

    requirements:
      JSON.stringify([
        "Nykyinen tiedosto luettu.",
        "Muutos suunnitelma luotu.",
        "Käyttäjän tavoite tiedossa."
      ]),

    nextAction:
      "Odota käyttäjän hyväksyntää."

  }





  if(prisma){


    const saved =

      await prisma.spacemonkeyApproval.create({

        data: approval

      })


    return {

      id:
        saved.id,

      ...saved

    }

  }





  const fallback = {

    id:
      `approval-${Date.now()}`,

    ...approval,

    createdAt:
      new Date().toISOString()

  }


  approvalHistory.push(fallback)


  return fallback

}







async function approveCurrentChange({

  prisma

}) {


  if(prisma){


    const approval =

      await prisma.spacemonkeyApproval.findFirst({

        where:{
          approved:false,
          status:"needs_review"
        },

        orderBy:{
          createdAt:"desc"
        }

      })



    if(!approval){


      return {

        approved:false,

        status:"failed",

        reason:
          "No pending approval."

      }

    }




    const updated =

      await prisma.spacemonkeyApproval.update({

        where:{
          id:approval.id
        },

        data:{

          approved:true,

          status:"approved",

          nextAction:
            "Muutos voidaan suorittaa.",

          approvedAt:
            new Date()

        }

      })



    return updated

  }



  return {

    approved:false,

    status:"failed",

    reason:
      "Prisma required."

  }

}







async function approveCodeChange({

  prisma,

  approval

}) {


  if(!approval){

    return {

      approved:false,

      status:"failed",

      reason:
        "Hyväksyntätietoa ei löytynyt."

    }

  }



  if(prisma){


    return prisma.spacemonkeyApproval.update({

      where:{
        id:approval.id
      },

      data:{

        approved:true,

        status:"approved",

        approvedAt:
          new Date()

      }

    })

  }


  return approval

}







async function getCurrentApproval({

  prisma

}) {


  if(prisma){


    return prisma.spacemonkeyApproval.findFirst({

      orderBy:{
        createdAt:"desc"
      }

    })

  }



  return approvalHistory.at(-1) || null

}







async function getApprovalHistory({

  prisma

}) {


  if(prisma){


    return prisma.spacemonkeyApproval.findMany({

      orderBy:{
        createdAt:"desc"
      }

    })

  }



  return [

    ...approvalHistory

  ]

}







function calculateRisk(plan){


  if(

    plan?.action === "update" &&

    plan?.filePath

  ){

    return "low"

  }


  return "medium"

}







function getChangeApprovalStatus(){


  return {

    engine:
      "Spacemonkey Change Approval Layer",

    version:
      "0.7.0",

    storage:
      "Prisma",

  }

}







export {

  evaluateCodeChangeApproval,

  approveCodeChange,

  approveCurrentChange,

  getCurrentApproval,

  getApprovalHistory,

  getChangeApprovalStatus

}
