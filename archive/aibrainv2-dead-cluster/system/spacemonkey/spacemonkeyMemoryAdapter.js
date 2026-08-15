const memoryHistory = []



const MEMORY_IMPORTANCE = {


  LOW:
    "low",


  MEDIUM:
    "medium",


  HIGH:
    "high"

}



function evaluateMemoryImportance({

  information

}) {


  const text =

    String(information || "")

      .toLowerCase()



  let importance =

    MEMORY_IMPORTANCE.LOW



  const importantSignals =

  [

    "haluan",

    "muista",

    "jatkossa",

    "aina",

    "projekti",

    "tavoite",

    "mieluummin",

    "älä"

  ]



  const matches =

    importantSignals.filter(

      signal =>

        text.includes(signal)

    )



  if(
    matches.length >= 2
  ){

    importance =
      MEMORY_IMPORTANCE.HIGH

  }


  else if(
    matches.length === 1
  ){

    importance =
      MEMORY_IMPORTANCE.MEDIUM

  }



  return {


    information,


    importance,


    signals:
      matches,


    shouldRemember:

      importance !== MEMORY_IMPORTANCE.LOW,


    createdAt:
      new Date().toISOString()

  }

}



function createMemoryCandidate({

  information

}) {


  const evaluation =

    evaluateMemoryImportance({

      information

    })



  if(
    !evaluation.shouldRemember
  ){

    return {


      saved:
        false,


      reason:
        "Tieto ei vaikuta pitkäaikaiselta muistilta."

    }

  }



  const memory = {


    id:
      `memory-${Date.now()}`,


    content:
      information,


    importance:
      evaluation.importance,


    createdAt:
      new Date().toISOString()

  }



  memoryHistory.push(

    memory

  )



  return {


    saved:
      true,


    memory

  }

}



function getMemoryHistory(){

  return [

    ...memoryHistory

  ]

}



function getMemoryStatus(){

  return {


    engine:
      "Spacemonkey Memory Adapter",


    version:
      "0.1.0",


    memories:
      memoryHistory.length

  }

}



export {

  MEMORY_IMPORTANCE,

  evaluateMemoryImportance,

  createMemoryCandidate,

  getMemoryHistory,

  getMemoryStatus

}
