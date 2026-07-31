const reflectionHistory = []



const REFLECTION_TYPES = {


  SUCCESS:
    "success",


  IMPROVEMENT:
    "improvement",


  UNKNOWN:
    "unknown"

}



function analyzeOutcome({

  action,

  result,

  expected

}) {


  const reflection = {


    id:
      `reflection-${Date.now()}`,


    action,


    result,


    expected,


    observations:
    [],


    lessons:
    [],


    type:
      REFLECTION_TYPES.UNKNOWN,


    createdAt:
      new Date().toISOString()

  }



  if(
    result &&
    expected &&
    result === expected
  ){

    reflection.type =
      REFLECTION_TYPES.SUCCESS


    reflection.observations.push(

      "Toiminta vastasi odotettua lopputulosta."

    )


    reflection.lessons.push(

      "Hyväksi havaittu toimintatapa voidaan säilyttää."

    )

  }

  else {


    reflection.type =
      REFLECTION_TYPES.IMPROVEMENT


    reflection.observations.push(

      "Lopputulos poikkesi odotuksesta."

    )


    reflection.lessons.push(

      "Ratkaisua tulee tarkastella ja parantaa."

    )

  }



  reflectionHistory.push(

    reflection

  )



  return reflection

}



function extractLesson({

  reflection

}) {


  return {


    lesson:

      reflection.lessons,


    importance:

      reflection.type === REFLECTION_TYPES.SUCCESS

        ?

        0.7

        :

        0.8,


    source:

      reflection.id

  }

}



function shouldStoreLesson({

  lesson

}) {


  return (

    lesson.importance >= 0.7

  )

}



function getReflectionHistory(){

  return [

    ...reflectionHistory

  ]

}



function getReflectionStatus(){

  return {


    engine:
      "Spacemonkey Reflection Engine",


    version:
      "0.1.0",


    reflections:
      reflectionHistory.length

  }

}



export {

  REFLECTION_TYPES,

  analyzeOutcome,

  extractLesson,

  shouldStoreLesson,

  getReflectionHistory,

  getReflectionStatus

}
