const codeMemoryHistory = []



function saveCodeMemory({

  filePath,

  instruction,

  proposal,

  validation,

  simulation,

  result

}) {


  const memory = {


    id:

      `code-memory-${Date.now()}`,


    filePath:

      filePath || null,


    instruction:

      instruction || null,


    stages:

    {

      proposal:

        Boolean(proposal),


      validation:

        Boolean(validation),


      simulation:

        Boolean(simulation)

    },


    result:

      result || "unknown",


    lessons:

    [

      "Säilytä toimiva rakenne.",

      "Testaa ennen muutosta.",

      "Hyväksytä riskialttiit muutokset."

    ],


    createdAt:

      new Date().toISOString()

  }



  codeMemoryHistory.push(

    memory

  )



  return memory

}





function getCodeMemory(){

  return [

    ...codeMemoryHistory

  ]

}





function getCodeMemoryStatus(){


  return {

    engine:

      "Spacemonkey Code Memory Engine",


    version:

      "0.1.0",


    memories:

      codeMemoryHistory.length

  }

}



export {

  saveCodeMemory,

  getCodeMemory,

  getCodeMemoryStatus

}
