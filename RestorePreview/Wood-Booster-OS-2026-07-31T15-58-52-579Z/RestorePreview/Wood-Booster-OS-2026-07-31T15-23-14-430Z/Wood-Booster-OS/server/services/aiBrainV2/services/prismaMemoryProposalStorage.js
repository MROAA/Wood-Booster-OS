/*
=====================================
WOOD-BOOSTER AI BRAIN V2

PRISMA MEMORY PROPOSAL STORAGE V1

Vastuut:

- tallentaa MemoryProposal tiedon Prismaan
- pitää tietokantakerroksen erillään AI-moduuleista
- tarjoaa turvallisen tallennusrajapinnan

Tämä EI:

- päätä hyväksytäänkö muisti
- muuta Memory-taulua
- muuta AI Brain pipelinea

=====================================
*/


async function storeMemoryProposal({
  prisma,
  proposal,
} = {}) {


  if (
    !prisma
  ) {

    return {

      success:
        false,

      status:
        "database_missing",

      proposal:
        null,

      error:
        "Prisma-yhteys puuttuu.",

    }

  }



  if (
    !proposal ||
    !proposal.key
  ) {

    return {

      success:
        false,

      status:
        "invalid_proposal",

      proposal:
        null,

      error:
        "Muistoehdotus puuttuu.",

    }

  }



  try {

    const created =
      await prisma.memoryProposal.create({

        data: {

          category:
            proposal.category ||
            "general",


          key:
            proposal.key,


          content:
            proposal.content,


          importance:
            proposal.importance ||
            5,


          status:
            proposal.status ||
            "pending",

        },

      })



    return {

      success:
        true,


      status:
        "stored",


      proposal:
        created,


      error:
        null,

    }


  }

  catch(error){

    return {

      success:
        false,


      status:
        "storage_failed",


      proposal:
        null,


      error:
        error.message,

    }

  }

}



export {
  storeMemoryProposal,
}
