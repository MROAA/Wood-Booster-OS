/*
=====================================
WOOD-BOOSTER AI BRAIN V2

SPACEMONKEY MEMORY PROPOSAL ADAPTER V1

Vastuut:

- vastaanottaa Spacemonkey muistoehdotuksen
- muotoilee sen MemoryProposal-muotoon
- pitää historian erillään käyttäjämuistista

Tämä EI:

- kirjoita tietokantaan
- hyväksy muistia automaattisesti
- muuta AI Brain pipelinea

=====================================
*/


function normalizeSpacemonkeyMemory({
  memory = {},
} = {}) {


  if (!memory.key) {

    return {

      success:
        false,

      status:
        "invalid_memory",

      proposal:
        null,

    }

  }



  return {

    success:
      true,


    status:
      "ready",


    proposal: {

      category:
        memory.category ||
        "project",


      key:
        memory.key,


      content:
        memory.content,


      importance:
        memory.importance ||
        8,


      status:
        "pending",


      memoryType:
        memory.memoryType ||
        "spacemonkey_history",

    },

  }

}



export {
  normalizeSpacemonkeyMemory,
}
