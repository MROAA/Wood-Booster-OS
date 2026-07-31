/*
=====================================

WOOD-BOOSTER AI BRAIN V2

MEMORY RETRIEVAL ENGINE V1


Vastuut:

- hakee relevantit muistot
- suodattaa muistihakua
- valmistaa muistikontextin


Ei:

- ei tallenna muistia
- ei muuta muistia
- ei hyväksy muistoja


=====================================
*/





function normalizeText(
  value
){

  return String(
    value || ""
  )
  .toLowerCase()

}







function calculateMemoryScore(
  message,
  memory
){

  const query =
    normalizeText(
      message
    )


  const content =
    normalizeText(
      memory.content
    )


  const key =
    normalizeText(
      memory.key
    )


  let score = 0



  const words =
    query.split(
      " "
    )



  for(
    const word
    of words
  ){

    if(
      word.length < 3
    ){

      continue

    }



    if(
      content.includes(
        word
      )
    ){

      score += 10

    }



    if(
      key.includes(
        word
      )
    ){

      score += 20

    }

  }



  if(
    memory.importance
  ){

    score +=
      memory.importance

  }



  return score

}








function retrieveRelevantMemories({

  message = "",

  memories = [],

  limit = 5,

} = {}){


  if(
    !Array.isArray(
      memories
    )
  ){

    return []

  }




  return memories

    .map(

      memory => ({

        memory,

        score:

          calculateMemoryScore(
            message,
            memory
          )

      })

    )


    .filter(

      item =>

        item.score > 0

    )


    .sort(

      (
        a,
        b
      ) =>

        b.score -
        a.score

    )


    .slice(
      0,
      limit
    )


    .map(

      item =>

        item.memory

    )

}







export {

  retrieveRelevantMemories

}
