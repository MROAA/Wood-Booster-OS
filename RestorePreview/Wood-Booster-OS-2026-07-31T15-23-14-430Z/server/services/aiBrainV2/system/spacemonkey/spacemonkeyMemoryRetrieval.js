import {
  rankMemories,
} from "./spacemonkeyMemoryRanking.js"





const retrievalHistory = []







function retrieveRelevantMemories({

  query,

  memories = [],

  limit = 5

}) {



  const rankedResult =

    rankMemories({

      query,

      memories

    })







  const result =

    rankedResult.memories

      .filter(

        item =>

          item.score > 0

      )

      .slice(

        0,

        limit

      )

      .map(

        item =>

        ({

          ...item.memory,


          relevance:

            Number(

              item.score.toFixed(2)

            )

        })

      )







  const response = {


    query,


    found:

      result.length > 0,


    count:

      result.length,


    memories:

      result,


    ranking:

      rankedResult,


    createdAt:

      new Date().toISOString()

  }





  retrievalHistory.push(

    response

  )





  return response

}







function getMemoryRetrievalStatus(){


  return {


    engine:

      "Spacemonkey Memory Retrieval Engine",


    version:

      "0.2.0",


    retrievals:

      retrievalHistory.length

  }

}







export {

  retrieveRelevantMemories,

  getMemoryRetrievalStatus

}
