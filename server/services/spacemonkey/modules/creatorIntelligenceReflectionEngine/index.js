const MODULE_ID = "creator-intelligence-reflection-engine"



const reflections = []



function createReflection({

  source,

  event,

  observation,

  lesson,

  recommendation,

}){

  const reflection = {

    id:
      `creator-reflection-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    source,

    event,

    observation,

    lesson,

    recommendation,

    status:
      "observed",

  }


  reflections.push(reflection)


  return reflection

}



function analyzeDecision(decision){

  const reflection = {

    source:
      "decision-analysis",


    event:
      decision.decision,


    observation:
      `Decision analyzed: ${decision.decision}`,


    lesson:
      decision.lesson || "No lesson recorded.",


    recommendation:
      "Review with Creator principles.",

  }


  return createReflection(
    reflection
  )

}



function getReflections(){

  return {

    moduleId:
      MODULE_ID,

    count:
      reflections.length,

    reflections,

  }

}



function getLatestReflections(){

  return reflections.slice(-10)

}



function getLessons(){

  return reflections.map(
    reflection => ({

      lesson:
        reflection.lesson,

      source:
        reflection.source,

    })
  )

}



export {

  MODULE_ID,

  createReflection,

  analyzeDecision,

  getReflections,

  getLatestReflections,

  getLessons,

}
