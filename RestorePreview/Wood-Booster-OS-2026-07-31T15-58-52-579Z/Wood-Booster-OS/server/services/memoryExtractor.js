import {
  generateWithOllama,
} from "./ollamaClient.js"



const ALLOWED_CATEGORIES = [
  "preference",
  "decision",
  "project",
  "learning",
  "workflow",
]



const EXPLICIT_MEMORY_PATTERNS = [

  /^muista\s+tämä\s*[:,-]?\s*/i,

  /^muista\s+pysyvästi\s*[:,-]?\s*/i,

  /^muista\s+tämä\s+pysyvästi\s*[:,-]?\s*/i,

  /^muista\s+että\s*/i,

  /^muista\s+etta\s*/i,

  /^tallenna\s+tämä\s+muistiin\s*[:,-]?\s*/i,

  /^tallenna\s+muistiin\s*[:,-]?\s*/i,

  /^laita\s+tämä\s+muistiin\s*[:,-]?\s*/i,

  /^pidä\s+tämä\s+muistissa\s*[:,-]?\s*/i,

]



function normalizeIdentifier(value){

  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ä/g,"a")
    .replace(/ö/g,"o")
    .replace(/å/g,"a")
    .replace(/[^a-z0-9]+/g,"_")
    .replace(/^_+|_+$/g,"")

}



function extractJSON(text){

  try{

    return JSON.parse(text)

  }

  catch{

    const match =
      String(text || "")
        .match(/\{[\s\S]*\}/)


    if(!match){

      return null

    }


    try{

      return JSON.parse(match[0])

    }

    catch{

      return null

    }

  }

}



function validateMemory(memory){

  if(!memory){

    return null

  }


  if(memory.shouldSave !== true){

    return {
      shouldSave:false,
    }

  }



  const key =
    normalizeIdentifier(
      memory.key
    )


  const content =
    String(
      memory.content || ""
    ).trim()



  const importance =
    Number(
      memory.importance
    )



  if(
    !key ||
    !content ||
    !Number.isFinite(importance) ||
    importance < 7
  ){

    return {
      shouldSave:false,
    }

  }



  const category =
    ALLOWED_CATEGORIES.includes(
      memory.category
    )

      ? memory.category

      : "preference"



  return {

    shouldSave:true,

    category,

    key,

    content,

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





function getLatestUserMessage(conversation){

  const text =
    String(
      conversation || ""
    )


  const match =
    text.match(
      /USER:\s*([\s\S]*?)(?=\n\nASSISTANT:|$)/i
    )


  return (
    match?.[1] ||
    text
  ).trim()

}





function detectCategory(content){

  const text =
    content.toLowerCase()



  if(
    text.includes("aina") ||
    text.includes("jatkossa") ||
    text.includes("kokonaiset tiedostot") ||
    text.includes("työskentely")
  ){

    return "workflow"

  }



  if(
    text.includes("haluan") ||
    text.includes("pidän") ||
    text.includes("suosin")
  ){

    return "preference"

  }



  if(
    text.includes("opin") ||
    text.includes("selitä")
  ){

    return "learning"

  }



  return "preference"

}





function createExplicitMemory(conversation){

  const message =
    getLatestUserMessage(
      conversation
    )



  for(
    const pattern of EXPLICIT_MEMORY_PATTERNS
  ){

    if(
      pattern.test(message)
    ){

      const content =
        message
          .replace(
            pattern,
            ""
          )
          .trim()



      if(!content){

        return null

      }



      return validateMemory({

        shouldSave:true,

        category:
          detectCategory(
            content
          ),

        key:
          normalizeIdentifier(
            content
          ).slice(
            0,
            100
          ),

        content,

        importance:9,

      })

    }

  }



  return null

}





export async function extractMemory({

  conversation,

  model = "qwen2.5:7b",

}){


  const explicitMemory =
    createExplicitMemory(
      conversation
    )



  if(explicitMemory){

    console.log(
      "EXPLICIT MEMORY COMMAND DETECTED:",
      explicitMemory
    )


    return explicitMemory

  }




  const prompt = `

Decide if this conversation contains permanent user memory.

Save only:

- user preferences
- workflow rules
- permanent decisions
- learning preferences


Return only JSON.


Example:

{
"shouldSave":true,
"category":"preference",
"key":"example",
"content":"user preference",
"importance":8
}


Conversation:

${conversation}

`



  try{


    const result =
      await generateWithOllama({

        prompt,

        model,

      })



    if(!result.success){

      return {
        shouldSave:false,
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



    return (
      validateMemory(
        json
      )
      ||
      {
        shouldSave:false,
      }
    )


  }


  catch(error){


    console.error(
      "MEMORY EXTRACTION ERROR:",
      error
    )


    return {
      shouldSave:false,
    }

  }


}
