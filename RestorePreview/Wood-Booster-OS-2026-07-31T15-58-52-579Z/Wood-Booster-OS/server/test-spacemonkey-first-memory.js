import prisma from "./prisma.js"


import {
  approveMemoryProposal,
} from "./services/aiBrainV2/services/memoryApprovalService.js"



try {


  console.log(
    "CREATING SPACEMONKEY FIRST MEMORY",
  )


  const proposal =
    await prisma.memoryProposal.create({

      data: {

        category:
          "user_preference",


        key:
          "coding_workflow",


        content:
          "Käyttäjä haluaa kokonaisia tiedostoja copy-pastettavana eikä pieniä koodimuutoksia. Eteneminen tapahtuu vaiheittain testaamalla jokainen vaihe.",


        importance:
          10,

      },

    })



  console.log(
    "MEMORY PROPOSAL CREATED",
  )


  console.log(
    proposal,
  )



  const approval =
    await approveMemoryProposal({

      prisma,

      proposalId:
        proposal.id,

    })



  console.log(
    "MEMORY APPROVAL RESULT",
  )


  console.log(
    JSON.stringify(
      approval,
      null,
      2,
    ),
  )


}


catch(error) {


  console.error(
    "MEMORY TEST FAILED",
  )


  console.error(
    error,
  )

}


finally {

  await prisma.$disconnect()

}
