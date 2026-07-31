/*
=====================================
WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY MEMORY PROPOSAL REPOSITORY V1

Vastuut:

- vastaanottaa muistoehdotuksen
- valmistaa tiedon tallennuskerrokselle
- pitää tietokannan erillään muista moduuleista

Tämä EI:

- kirjoita vielä Prisma-tietokantaan
- hyväksy muistia automaattisesti
- muuta AI Brain pipelinea

=====================================
*/


function createMemoryProposalRecord({
  proposal,
} = {}) {


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

    }

  }



  return {

    success:
      true,


    status:
      "ready_for_storage",


    proposal: {

      category:
        proposal.category,


      key:
        proposal.key,


      content:
        proposal.content,


      importance:
        proposal.importance,


      status:
        proposal.status,


      memoryType:
        proposal.memoryType,

    },

  }

}



export {
  createMemoryProposalRecord,
}
