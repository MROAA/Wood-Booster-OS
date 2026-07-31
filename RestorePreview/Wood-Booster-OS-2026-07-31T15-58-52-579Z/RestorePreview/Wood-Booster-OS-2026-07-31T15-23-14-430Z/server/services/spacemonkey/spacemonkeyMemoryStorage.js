/*
=====================================

SPACEMONKEY MEMORY STORAGE

Tallentaa Spacemonkeyn oppimismuistit
pysyvään tietokantaan.

Pipeline:

Memory Proposal
        |
        v
Memory Storage
        |
        v
Prisma Memory Model

=====================================
*/


function createMemoryRecord({

  proposal,

}) {


  return {


    agent:
      proposal.agent,


    type:
      proposal.type,


    title:
      proposal.title,


    content:
      proposal.content,


    importance:
      proposal.importance,


    status:
      "stored",


    createdAt:
      new Date()



  }


}





async function storeSpacemonkeyMemory({

  prisma,

  proposal,

}) {


  if(
    !proposal
  ){

    return {

      success:false,

      reason:
        "No memory proposal"

    }

  }



  if(
    proposal.approved === false
  ){

    return {

      success:false,

      reason:
        "Memory proposal not approved"

    }

  }



  const memoryRecord =
    createMemoryRecord({

      proposal

    })



  const savedMemory =
    await prisma.memory.create({

      data:
        memoryRecord

    })



  return {


    success:true,


    memory:
      savedMemory


  }


}





export {

  createMemoryRecord,

  storeSpacemonkeyMemory

}
