const transformationHistory = []



function normalizeText(text){

  return String(text || "")

    .toLowerCase()

    .trim()

}



function transformMemory({

  content

}) {


  const text =

    normalizeText(content)



  let category =
    "general"


  let key =
    "general_information"



  let transformedContent =
    content



  if(

    text.includes("suomen") ||

    text.includes("suomeksi") ||

    text.includes("kieli")

  ){

    category =
      "communication"


    key =
      "response_language"


    transformedContent =

      "Käyttäjä haluaa vastaukset selkeällä suomen kielellä."

  }



  else if(

    text.includes("selkeä") ||

    text.includes("vaihe") ||

    text.includes("ymmärrettävä")

  ){

    category =
      "communication"


    key =
      "response_style"


    transformedContent =

      "Käyttäjä haluaa selkeitä ja vaiheittaisia vastauksia."

  }



  else if(

    text.includes("haluan") ||

    text.includes("muista")

  ){

    category =
      "user_preference"


    key =
      "user_preference"


    transformedContent =

      content

  }



  const result = {


    original:
      content,


    category,


    key,


    content:
      transformedContent,


    createdAt:
      new Date().toISOString()

  }



  transformationHistory.push(

    result

  )



  return result

}



function getMemoryTransformerStatus(){

  return {

    engine:
      "Spacemonkey Memory Transformer",

    version:
      "0.1.0",

    transformations:
      transformationHistory.length

  }

}



export {

  transformMemory,

  getMemoryTransformerStatus

}
