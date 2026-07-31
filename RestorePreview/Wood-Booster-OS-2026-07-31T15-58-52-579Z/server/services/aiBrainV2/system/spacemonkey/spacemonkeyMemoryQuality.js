const qualityHistory = []



function normalizeText(text){

  return String(text || "")

    .toLowerCase()

    .replace(
      /[^a-z0-9äöå\s]/g,
      ""
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim()

}



function compareMemorySimilarity({

  existingMemories = [],

  content

}) {


  const normalizedNew =

    normalizeText(content)



  for(
    const memory
    of existingMemories
  ){


    const normalizedExisting =

      normalizeText(
        memory.content
      )



    if(
      normalizedExisting === normalizedNew
    ){

      return {

        duplicate:
          true,

        matchedMemory:
          memory

      }

    }

  }



  return {

    duplicate:
      false,

    matchedMemory:
      null

  }

}



function evaluateMemoryQuality({

  existingMemories = [],

  content

}) {


  const similarity =

    compareMemorySimilarity({

      existingMemories,

      content

    })



  const result = {


    content,


    duplicate:
      similarity.duplicate,


    accepted:
      !similarity.duplicate,


    matchedMemory:
      similarity.matchedMemory,


    reason:

      similarity.duplicate

        ?

        "Muisti löytyy jo olemassa olevasta tiedosta."

        :

        "Uusi muistettava tieto.",


    createdAt:
      new Date().toISOString()

  }



  qualityHistory.push(

    result

  )



  return result

}



function getMemoryQualityStatus(){

  return {


    engine:
      "Spacemonkey Memory Quality Engine",


    version:
      "0.1.0",


    evaluations:
      qualityHistory.length

  }

}



export {

  evaluateMemoryQuality,

  compareMemorySimilarity,

  getMemoryQualityStatus

}
