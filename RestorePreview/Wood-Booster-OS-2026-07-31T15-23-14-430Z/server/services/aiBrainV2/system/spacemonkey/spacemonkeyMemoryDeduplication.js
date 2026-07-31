const deduplicationHistory = []





function normalizeText(
  content = ""
){

  return String(content)

    .toLowerCase()

    .replace(
      /\s+/g,
      " "
    )

    .trim()

}







function calculateSimilarity(
  first,
  second
){

  const a =
    normalizeText(first)


  const b =
    normalizeText(second)



  if(
    !a ||
    !b
  ){

    return 0

  }





  if(
    a === b
  ){

    return 1

  }





  const aWords =
    new Set(
      a.split(" ")
    )


  const bWords =
    new Set(
      b.split(" ")
    )





  const intersection =

    [

      ...aWords

    ]

    .filter(

      word =>
        bWords.has(word)

    )

    .length





  const union =

    new Set(

      [

        ...aWords,

        ...bWords

      ]

    )

    .size





  if(
    union === 0
  ){

    return 0

  }





  return intersection / union

}







function checkDuplicateMemory({

  content,

  existingMemories = []

} = {}) {



  const matches =

    existingMemories.map(

      memory =>

      ({

        memory,


        similarity:

          calculateSimilarity(

            content,

            memory.content

          )

      })

    )

    .filter(

      item =>

        item.similarity >= 0.8

    )







  const result = {


    duplicate:

      matches.length > 0,


    matches,


    checkedAt:

      new Date().toISOString()

  }





  deduplicationHistory.push(

    result

  )





  return result

}







function getMemoryDeduplicationStatus(){

  return {


    engine:

      "Spacemonkey Memory Deduplication",


    version:

      "1.0.0",


    checks:

      deduplicationHistory.length

  }

}







export {

  checkDuplicateMemory,

  getMemoryDeduplicationStatus

}
