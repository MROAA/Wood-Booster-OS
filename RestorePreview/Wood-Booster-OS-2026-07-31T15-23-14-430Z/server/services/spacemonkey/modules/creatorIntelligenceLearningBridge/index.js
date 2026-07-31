const MODULE_ID = "creator-intelligence-learning-bridge"



const learningEvents = []



function createLearningEvent({

  source,

  lesson,

  category,

  impact,

}){

  const learning = {

    id:
      `creator-learning-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    source,

    category,

    lesson,

    impact,

    status:
      "captured",

  }


  learningEvents.push(learning)


  return learning

}



function processReflection(reflection){

  return createLearningEvent({

    source:
      reflection.source,


    category:
      "reflection-learning",


    lesson:
      reflection.lesson,


    impact:
      reflection.recommendation,

  })

}



function getLearningEvents(){

  return {

    moduleId:
      MODULE_ID,

    count:
      learningEvents.length,

    events:
      learningEvents,

  }

}



function getLatestLearning(){

  return learningEvents.slice(-10)

}



function exportKnowledgeUpdate(){

  return {

    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),


    updates:
      learningEvents.map(
        event => ({

          category:
            event.category,

          lesson:
            event.lesson,

        })
      ),

  }

}



export {

  MODULE_ID,

  createLearningEvent,

  processReflection,

  getLearningEvents,

  getLatestLearning,

  exportKnowledgeUpdate,

}
