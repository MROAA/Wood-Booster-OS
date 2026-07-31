const retrievalHistory = []



function normalizeText(text){

  return String(text || "")

    .toLowerCase()

    .replace(
      /[^a-z0-9äöå\s]/g,
      ""
    )

    .split(" ")

    .filter(Boolean)

}



function calculateMatchScore({

  query,

  memory

}) {


  const queryWords =

    normalizeText(query)



  const memoryWords =

    normalizeText(
      memory.content
    )



  let matches = 0



  for(
    const word
    of queryWords
  ){

    if(
      memoryWords.includes(word)
    ){

      matches++

    }

  }



  const wordScore =

    queryWords.length > 0

      ?

      matches / queryWords.length

      :

      0



  const importanceScore =

    Number(memory.importance || 0)
      /
    10



  return (

    wordScore * 0.7

    +

    importanceScore * 0.3

  )

}



function retrieveRelevantMemories({

  query,

  memories = [],

  limit = 5

}) {


  const ranked =

    memories.map(

      memory => ({

        memory,


        score:

          calculateMatchScore({

            query,

            memory

          })

      })

    )



  const result =

    ranked

      .filter(

        item =>

          item.score > 0

      )

      .sort(

        (a,b)=>

          b.score -

          a.score

      )

      .slice(

        0,

        limit

      )

      .map(

        item => ({

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

      "0.1.0",


    retrievals:

      retrievalHistory.length

  }

}



export {

  retrieveRelevantMemories,

  calculateMatchScore,

  getMemoryRetrievalStatus

}
