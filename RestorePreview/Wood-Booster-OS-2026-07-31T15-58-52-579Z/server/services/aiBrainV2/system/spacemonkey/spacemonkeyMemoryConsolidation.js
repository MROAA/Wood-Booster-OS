const consolidationHistory = []





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







function mergeMemories({

  memories = []

} = {}) {


  if(
    memories.length === 0
  ){

    return {

      merged:false,

      reason:
        "No memories."

    }

  }





  const contents =

    memories.map(

      memory =>

        normalizeText(
          memory.content
        )

    )







  const mergedContent =

    memories

      .map(

        memory =>

          memory.content

      )

      .join(" ")







  const result = {


    merged:true,


    sourceCount:

      memories.length,


    original:

      contents,



    content:

      mergedContent,



    createdAt:

      new Date().toISOString()

  }





  consolidationHistory.push(

    result

  )





  return result

}







function findConsolidationCandidates({

  memories = [],

  threshold = 0.8

} = {}) {


  const groups = []





  for(
    let i = 0;
    i < memories.length;
    i++
  ){

    const current =

      memories[i]



    const matches =

      memories.filter(

        memory =>

          memory.id !== current.id &&

          normalizeText(
            memory.content
          )

          .includes(

            normalizeText(
              current.content
            )

          )

      )



    if(
      matches.length
    ){

      groups.push({

        primary:

          current,


        duplicates:

          matches

      })

    }

  }





  return groups

}







function getMemoryConsolidationStatus(){

  return {


    engine:

      "Spacemonkey Memory Consolidation",


    version:

      "1.0.0",


    consolidations:

      consolidationHistory.length

  }

}







export {

  mergeMemories,

  findConsolidationCandidates,

  getMemoryConsolidationStatus

}
