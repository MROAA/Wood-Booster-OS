const MODULE_ID = "security-learning-memory"



const securityLessons = []



function addSecurityLesson({

  event,

  risk,

  lesson,

  source,

}){

  const entry = {

    id:
      `security-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    event,

    risk,

    lesson,

    source,

  }


  securityLessons.push(entry)


  return entry

}



function getSecurityMemory(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      securityLessons.length,

    lessons:
      securityLessons,

  }

}



function findLessonsByRisk(risk){

  return securityLessons.filter(
    lesson =>
      lesson.risk === risk
  )

}



function getCriticalLessons(){

  return securityLessons.filter(
    lesson =>
      lesson.risk === "critical"
  )

}



export {

  MODULE_ID,

  addSecurityLesson,

  getSecurityMemory,

  findLessonsByRisk,

  getCriticalLessons,

}
