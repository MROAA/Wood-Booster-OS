/*
==================================================

SPACEMONKEY RECOVERY APPROVAL SERVICE

Turvallinen palautuksen hyväksyntäkerros.

Vastuut:

- luo recovery approval request
- tallentaa hyväksyntätiedon
- hallitsee palautuksen hyväksyntää

Ei:
- suorita palautusta
- ohita käyttäjän hyväksyntää
- muuta järjestelmää

==================================================
*/


import prisma from "../../../../../prisma.js"





function normalizeRecoveryRequest({

  snapshot,

  reason,

} = {}) {

  return {

    filePath:
      snapshot?.path ||
      null,


    instruction:
      "Restore Spacemonkey snapshot",


    changePlan:
      JSON.stringify({

        action:
          "restore_snapshot",

        snapshot:
          snapshot?.filename ||
          null

      }),


    reasons:
      reason ||
      "Recovery requested",


    requirements:
      "User approval required",


    nextAction:
      "Waiting for approval"

  }

}







async function createRecoveryApproval({

  snapshot,

  reason,

} = {}) {


  if (!snapshot) {

    return {

      success:false,

      approval:null,

      error:
        "Snapshot missing"

    }

  }




  const request =
    normalizeRecoveryRequest({

      snapshot,

      reason

    })





  const approval =
    await prisma
      .spacemonkeyApproval
      .create({

        data: {

          approved:false,


          status:
            "waiting",


          risk:
            "high",


          filePath:
            request.filePath,


          instruction:
            request.instruction,


          changePlan:
            request.changePlan,


          reasons:
            request.reasons,


          requirements:
            request.requirements,


          nextAction:
            request.nextAction

        }

      })





  return {

    success:true,

    approval,

    error:null

  }

}







async function approveRecovery({

  approvalId,

} = {}) {


  const approval =
    await prisma
      .spacemonkeyApproval
      .update({

        where: {

          id:
            approvalId

        },


        data: {

          approved:true,


          status:
            "approved",


          approvedAt:
            new Date()

        }

      })





  return {

    success:true,

    approval

  }

}







async function getRecoveryApprovals() {

  return await prisma
    .spacemonkeyApproval
    .findMany({

      orderBy: {

        createdAt:
          "desc"

      }

    })

}







export {

  createRecoveryApproval,

  approveRecovery,

  getRecoveryApprovals

}
