const consolidationHistory = []



function normalizeText(text){

  return String(text || "")

    .toLowerCase()

}



function detectCategory(content){

  const text =
    normalizeText(content)



  if(
    text.includes("suomen") ||
    text.includes("kieli") ||
    text.includes("suomeksi")
  ){

    return "language"

  }



  if(
    text.includes("selkeä") ||
    text.includes("selkeät") ||
    text.includes("vaihe")
  ){

    return "communication"

  }



  if(
    text.includes("muista") ||
    text.includes("haluan")
  ){

    return "user_preference"

  }



  return "general"

}



function consolidateMemories({

  memories = []

}) {


  const groups = {}



  for(
    const memory
    of memories
  ){


    const category =

      detectCategory(
        memory.content
      )



    if(
      !groups[category]
    ){

      groups[category] = []

    }



    groups[category].push(

      memory

    )

  }



  const consolidated =



    Object.entries(groups)

      .map(

        ([category, items]) => ({

          category,


          count:
            items.length,


          memories:
            items,


          summary:

            createSummary(
              category,
              items
            )

        })

      )



  const result = {


    groups:

      consolidated,


    createdAt:

      new Date().toISOString()

  }



  consolidationHistory.push(

    result

  )



  return result

}



function createSummary(

  category,

  memories

){


  if(
    category === "language"
  ){

    return "Käyttäjä haluaa vastaukset suomen kielellä."

  }



  if(
    category === "communication"
  ){

    return "Käyttäjä haluaa selkeät ja vaiheittaiset vastaukset."

  }



  if(
    category === "user_preference"
  ){

    return "Käyttäjän henkilökohtainen toimintatapa."

  }



  return "Yleinen käyttäjätieto."

}



function getMemoryConsolidationStatus(){

  return {

    engine:
      "Spacemonkey Memory Consolidation Engine",

    version:
      "0.1.0",

    consolidations:
      consolidationHistory.length

  }

}



export {

  consolidateMemories,

  detectCategory,

  getMemoryConsolidationStatus

}
