const categoryHistory = []



const MEMORY_CATEGORIES = {

  USER_IDENTITY:
    "user_identity",

  DEVELOPER_PREFERENCE:
    "developer_preference",

  PROJECT_KNOWLEDGE:
    "project_knowledge",

  WORKFLOW:
    "workflow",

  BRAND_RULE:
    "brand_rule",

  SYSTEM_RULE:
    "system_rule",

  CONVERSATION_FACT:
    "conversation_fact",

  GENERAL:
    "general"

}





function containsAny(text, words){

  return words.some(

    word =>

      text.includes(word)

  )

}





function categorizeMemory({

  content = ""

} = {}) {


  const text =

    String(content)

      .toLowerCase()

      .trim()





  let category =
    MEMORY_CATEGORIES.GENERAL





  if(
    containsAny(

      text,

      [

        "marc",

        "luoja",

        "tekijä",

        "minä"

      ]

    )

  ){

    category =
      MEMORY_CATEGORIES.USER_IDENTITY

  }







  else if(

    containsAny(

      text,

      [

        "haluan",

        "aina",

        "käytä",

        "älä",

        "pidän"

      ]

    )

  ){

    category =
      MEMORY_CATEGORIES.DEVELOPER_PREFERENCE

  }







  else if(

    containsAny(

      text,

      [

        "wood-booster",

        "puu",

        "brändi",

        "asiakas",

        "tuote"

      ]

    )

  ){

    category =
      MEMORY_CATEGORIES.PROJECT_KNOWLEDGE

  }







  else if(

    containsAny(

      text,

      [

        "vaihe",

        "suunnitelma",

        "prosessi",

        "workflow"

      ]

    )

  ){

    category =
      MEMORY_CATEGORIES.WORKFLOW

  }







  else if(

    containsAny(

      text,

      [

        "sääntö",

        "turvallisuus",

        "policy",

        "periaate"

      ]

    )

  ){

    category =
      MEMORY_CATEGORIES.SYSTEM_RULE

  }





  const result = {

    category,

    confidence:

      category === MEMORY_CATEGORIES.GENERAL

        ?

        0.3

        :

        0.8,

    analyzedAt:

      new Date().toISOString()

  }





  categoryHistory.push(

    result

  )





  return result

}





function getMemoryCategoryHistory(){

  return [

    ...categoryHistory

  ]

}





function getMemoryCategorizerStatus(){

  return {

    engine:

      "Spacemonkey Memory Categorizer",

    version:

      "1.0.0",

    analyzed:

      categoryHistory.length

  }

}





export {

  MEMORY_CATEGORIES,

  categorizeMemory,

  getMemoryCategoryHistory,

  getMemoryCategorizerStatus

}
