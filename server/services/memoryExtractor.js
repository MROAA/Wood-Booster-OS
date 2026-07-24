import {
  generateWithOllama,
} from "./ollamaClient.js"





/*
==================================================

WOOD-BOOSTER MEMORY EXTRACTION ENGINE v2

Memory EI ole tietopankki.

Knowledge:
- yrityksen faktat
- tuotteet
- filosofia
- materiaalit
- historia

Memory:
- käyttäjän mieltymykset
- pysyvät päätökset
- projektin tärkeät valinnat

==================================================
*/







function extractJSON(text) {


  try {


    return JSON.parse(text)


  }

  catch {


    const match =

      text.match(
        /\{[\s\S]*\}/
      )



    if (!match) {


      return null


    }



    try {


      return JSON.parse(
        match[0]
      )


    }

    catch {


      return null


    }


  }


}









function validateMemory(memory) {


  if (!memory) {


    return null


  }







  if (

    memory.shouldSave !== true

  ) {


    return {

      shouldSave:false

    }


  }









  const blockedKeys = [

    "wood-booster",

    "product",

    "products",

    "product_type",

    "company",

    "business",

    "brand",

    "philosophy",

    "values",

    "information",

    "general",

    "fact",

    "history",

    "description"

  ]







  const key =

    String(

      memory.key || ""

    )

      .toLowerCase()







  if (

    !key ||

    blockedKeys.some(

      item =>

        key.includes(item)

    )

  ) {


    return {

      shouldSave:false

    }


  }









  const category =

    String(

      memory.category || ""

    )

      .toLowerCase()








  const allowedCategories = [

    "preference",

    "decision",

    "project",

    "learning",

    "workflow"

  ]








  if (

    !allowedCategories.includes(

      category

    )

  ) {


    return {

      shouldSave:false

    }


  }









  const importance =

    Number(

      memory.importance

    )








  if (

    importance < 7

  ) {


    return {

      shouldSave:false

    }


  }








  if (

    !memory.content

  ) {


    return {

      shouldSave:false

    }


  }









  return {


    shouldSave:true,


    category,


    key:

      key

        .replace(

          /[^a-z0-9_]/g,

          "_"

        ),



    content:

      String(

        memory.content

      ),



    importance:

      Math.min(

        10,

        Math.max(

          7,

          importance

        )

      )


  }


}









export async function extractMemory({

  conversation,

  model = "qwen2.5:7b"

}) {





  const prompt = `


You are the Wood-Booster AI Memory Evaluation System.


Your task:

Decide if this conversation contains information
that should become PERMANENT USER MEMORY.



IMPORTANT:

Memory is NOT knowledge.

Do NOT save:

- company descriptions
- products
- services
- brand philosophy
- marketing text
- facts about Wood-Booster
- explanations
- answers from AI



Save ONLY:


1. USER PREFERENCES

Examples:

"The user prefers complete files instead of small code edits."

"The user prefers step-by-step instructions."


2. IMPORTANT DECISIONS

Examples:

"The project will use Prisma instead of localStorage."

"The first version will not auto publish."


3. WORKFLOW RULES

Examples:

"The user wants testing after every major change."



4. LONG TERM PROJECT FACTS

Only if they affect future development.



Importance:

10:
Critical permanent rule


8-9:
Important long term preference


7:
Useful permanent information


Below 7:
Do not save.



Return ONLY JSON.



If memory exists:


{
 "shouldSave": true,
 "category": "preference",
 "key": "short_identifier",
 "content": "clear statement",
 "importance": 8
}



If nothing should be saved:


{
 "shouldSave": false
}



Conversation:


${conversation}


`







  const result =

    await generateWithOllama({

      prompt,

      model,

    })






  if (!result.success) {


    return {

      shouldSave:false

    }


  }








  console.log(

    "RAW MEMORY RESPONSE:"

  )


  console.log(

    result.response

  )









  const json =

    extractJSON(

      result.response

    )







  const memory =

    validateMemory(

      json

    )







  if (!memory) {


    console.log(

      "MEMORY REJECTED"

    )


    return {

      shouldSave:false

    }


  }








  return memory


}