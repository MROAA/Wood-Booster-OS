const rankingHistory = []





const CATEGORY_WEIGHTS = {

  identity:
    10,

  developer_preference:
    10,

  preference:
    8,

  workflow:
    8,

  project:
    7,

  knowledge:
    5,

  spacemonkey:
    5

}







function normalizeText(
  content = ""
){

  return String(content)

    .toLowerCase()

    .trim()

}







function isInvalidMemory(memory){

  const content =

    normalizeText(

      memory?.content

    )



  if(!content){

    return true

  }



  const blockedStarts = [

    "mitä muistat",

    "miten haluan",

    "mikä",

    "kuinka",

    "milloin",

    "missä",

    "kuka"

  ]



  return blockedStarts.some(

    prefix =>

      content.startsWith(prefix)

  )

}







function calculateRelevance({

  memory,

  query = ""

} = {}) {


  const content =

    normalizeText(

      memory.content

    )



  const search =

    normalizeText(

      query

    )





  let score = 0





  const categoryWeight =

    CATEGORY_WEIGHTS[

      memory.category

    ]

    ||

    3





  score += categoryWeight





  if(
    search &&
    content.includes(search)
  ){

    score += 5

  }





  const queryWords =

    search.split(" ")





  for(
    const word
    of queryWords
  ){

    if(
      word.length > 2 &&
      content.includes(word)
    ){

      score += 1

    }

  }





  if(
    memory.importance
  ){

    score +=

      Number(
        memory.importance
      )

      *

      0.5

  }





  return score

}







function rankMemories({

  memories = [],

  query = ""

} = {}) {


  const validMemories =

    memories.filter(

      memory =>

        !isInvalidMemory(memory)

    )







  const ranked =

    validMemories.map(

      memory =>

      ({

        memory,


        score:

          calculateRelevance({

            memory,

            query

          })

      })

    )

    .sort(

      (a,b)=>

        b.score -

        a.score

    )







  const result = {


    query,


    count:

      ranked.length,


    memories:

      ranked,


    createdAt:

      new Date().toISOString()

  }





  rankingHistory.push(

    result

  )





  return result

}







function getMemoryRankingStatus(){

  return {


    engine:

      "Spacemonkey Memory Ranking",


    version:

      "1.1.0",


    rankings:

      rankingHistory.length

  }

}







export {

  rankMemories,

  calculateRelevance,

  getMemoryRankingStatus,

  isInvalidMemory

}
