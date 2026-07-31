import {
  getSpacemonkeyCore,
} from "./spacemonkeyLoader.js"



const CONTEXT_TYPES = {


  MEMORY:
    "memory",


  KNOWLEDGE:
    "knowledge",


  MISSION:
    "mission",


  GOAL:
    "goal",


  STATE:
    "state"

}



const contextHistory = []



function calculateRelevance({

  item,

  query,

}) {


  const text =

    JSON.stringify(item)

      .toLowerCase()



  const search =

    String(query)

      .toLowerCase()



  let score = 0



  const words =

    search
      .split(" ")
      .filter(Boolean)



  for(
    const word
    of words
  ){

    if(
      text.includes(word)
    ){

      score += 0.2

    }

  }



  return Math.min(

    score,

    1

  )

}



function rankContextItems({

  items,

  query,

}) {


  return items

    .map(

      item =>

      ({

        item,


        relevance:

          calculateRelevance({

            item,

            query

          })

      })

    )


    .sort(

      (a,b)=>

        b.relevance -

        a.relevance

    )

}



function selectRelevantContext({

  query,

  memory = [],

  knowledge = [],

  goals = [],

  state = {}

}) {


  const rankedMemory =

    rankContextItems({

      items:
        memory,

      query

    })



  const rankedKnowledge =

    rankContextItems({

      items:
        knowledge,

      query

    })



  const rankedGoals =

    rankContextItems({

      items:
        goals,

      query

    })



  const context = {


    query,


    memory:

      rankedMemory

        .filter(

          item =>
            item.relevance > 0

        ),



    knowledge:

      rankedKnowledge

        .filter(

          item =>
            item.relevance > 0

        ),



    goals:

      rankedGoals

        .filter(

          item =>
            item.relevance > 0

        ),



    state

  }



  contextHistory.push({

    query,

    timestamp:

      new Date().toISOString()

  })



  return context

}



function createContextSummary({

  context,

}) {


  return {


    importantInformation:


      {

        memories:
          context.memory.length,


        knowledge:
          context.knowledge.length,


        goals:
          context.goals.length

      },


    generatedAt:

      new Date().toISOString()

  }

}



function getContextStatus(){


  const core =
    getSpacemonkeyCore()



  return {


    agent:
      "spacemonkey",


    coreVersion:
      core.version,


    contextsCreated:
      contextHistory.length,


    history:
      contextHistory

  }

}



export {

  CONTEXT_TYPES,

  selectRelevantContext,

  createContextSummary,

  getContextStatus

}
