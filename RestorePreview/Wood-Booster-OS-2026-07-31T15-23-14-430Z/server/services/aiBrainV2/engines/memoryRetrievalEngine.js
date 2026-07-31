/*
=====================================
WOOD-BOOSTER AI BRAIN V2

MEMORY RETRIEVAL ENGINE

SPACEMONKEY MEMORY FILTERED VERSION

Vastuut:

- hakee hyväksytyt muistit
- normalisoi hakusanat
- tunnistaa semanttisia käsitteitä
- arvioi muistien merkityksellisyyttä
- estää keskustelukysymysten muuttumisen muisteiksi
- palauttaa vain relevantit käyttäjämuistit

=====================================
*/


import {
  getMemory,
} from "../../memoryService.js"


import {
  normalizeSemanticText,
} from "./semanticTokenNormalizer.js"





const DEFAULT_LIMIT = 8

const MEMORY_POOL_LIMIT = 100





const STOP_WORDS = new Set([

  "ja",
  "se",
  "ne",
  "etta",
  "joka",
  "jotka",
  "kun",
  "kuin",
  "mutta",
  "myos",
  "niin",
  "olen",
  "olla",
  "ovat",
  "oli",
  "tama",
  "tassa",
  "tuo",
  "sita",
  "sitten",
  "vain",
  "viela",
  "mina",
  "minun",
  "sina",
  "sinun",
  "meidan",
  "teidan",
  "haluan",
  "voin",
  "pitaa",
  "jokainen",
  "user"

])







function normalizeText(value){

  return normalizeSemanticText(
    value
  )

}







function tokenizeDirect(value){

  const normalized =
    normalizeText(value)


  if(!normalized){

    return []

  }


  return [

    ...new Set(

      normalized

        .split(" ")

        .map(

          word =>
            word.trim()

        )

        .filter(

          word =>

            word.length >= 2 &&

            !STOP_WORDS.has(word)

        )

    )

  ]

}







function normalizeImportance(value){

  const number =
    Number(value)


  if(!Number.isFinite(number)){

    return 0

  }


  return Math.max(

    0,

    Math.min(

      10,

      number

    )

  )

}








function isInvalidMemory(memory){


  const content =

    String(
      memory?.content || ""
    )

    .toLowerCase()

    .trim()



  if(!content){

    return true

  }




  const blockedStarts = [

    "mitä muistat",

    "miten haluan",

    "mikä on",

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








function calculateMatchScore({

  memory,

  messageTokens

}){


  const memoryTokens =

    tokenizeDirect(

      memory.content

    )



  const matches =

    messageTokens.filter(

      token =>

        memoryTokens.includes(token)

    ).length




  const importance =

    normalizeImportance(
      memory.importance
    )



  return (

    matches * 4

    +

    importance

  )

}








function createRetrievalResult({

  memories,

  candidates,

}){


  return {


    memories,


    debug: {


      candidateCount:

        candidates.length,


      selectedCount:

        memories.length


    }


  }

}








async function retrieveRelevantMemories({

  prisma,

  message,

  limit = DEFAULT_LIMIT

}){


  const messageTokens =

    tokenizeDirect(
      message
    )




  if(!prisma){

    return createRetrievalResult({

      memories: [],

      candidates: []

    })

  }






  const candidates =

    await getMemory({

      prisma,

      limit:
        MEMORY_POOL_LIMIT

    })







  const normalizedCandidates =

    Array.isArray(candidates)

      ?

      candidates.filter(

        memory =>

          !isInvalidMemory(memory)

      )

      :

      []







  const scoredMemories =

    normalizedCandidates

      .map(

        memory => ({


          ...memory,


          retrievalScore:

            calculateMatchScore({

              memory,

              messageTokens

            })


        })

      )

      .filter(

        memory =>

          memory.retrievalScore > 0

      )

      .sort(

        (a,b) =>

          b.retrievalScore -

          a.retrievalScore

      )

      .slice(

        0,

        limit

      )








  return createRetrievalResult({

    memories:

      scoredMemories,


    candidates:

      normalizedCandidates

  })

}








export {

  retrieveRelevantMemories,

  isInvalidMemory,

  calculateMatchScore,

}
