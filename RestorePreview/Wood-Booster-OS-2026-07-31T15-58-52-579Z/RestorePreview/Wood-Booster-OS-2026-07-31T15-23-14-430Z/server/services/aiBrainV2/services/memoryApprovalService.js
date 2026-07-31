/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY APPROVAL SERVICE V1

Vastuut:

- hyväksyy MemoryProposal ehdotuksen
- siirtää hyväksytyn tiedon Memory-tauluun
- päivittää proposal-tilan

Tämä EI:

- päätä itse mitä tallennetaan
- muuta AI Brain pipelinea
- käsittele kielimallia

=====================================
*/


async function approveMemoryProposal({
  prisma,
  proposalId,
} = {}) {


  if (
    !prisma
  ) {

    return {

      success:
        false,

      status:
        "database_missing",

      error:
        "Prisma-yhteys puuttuu.",

    }

  }



  if (
    !proposalId
  ) {

    return {

      success:
        false,

      status:
        "proposal_missing",

      error:
        "MemoryProposal id puuttuu.",

    }

  }



  try {


    const proposal =
      await prisma.memoryProposal.findUnique({

        where:{
          id:
            proposalId,
        },

      })



    if (
      !proposal
    ) {

      return {

        success:
          false,

        status:
          "proposal_not_found",

        error:
          "Muistoehdotusta ei löytynyt.",

      }

    }



    const memory =
      await prisma.memory.create({

        data: {

          category:
            proposal.category,


          key:
            proposal.key,


          content:
            proposal.content,


          importance:
            proposal.importance,

        },

      })



    const updatedProposal =
      await prisma.memoryProposal.update({

        where:{
          id:
            proposalId,
        },


        data: {

          status:
            "approved",

        },

      })



    return {

      success:
        true,


      status:
        "approved",


      memory,


      proposal:
        updatedProposal,


      error:
        null,

    }


  }

  catch(error){

    return {

      success:
        false,


      status:
        "approval_failed",


      error:
        error.message,

    }

  }

}



export {
  approveMemoryProposal,
}
