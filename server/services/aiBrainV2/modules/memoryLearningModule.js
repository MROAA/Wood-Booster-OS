/*
=====================================

WOOD-BOOSTER AI BRAIN V2

MEMORY LEARNING MODULE

Vastuut:

- tunnistaa käyttäjän suoran muistipyynnön
- luo MemoryProposal-ehdotuksen
- luokittelee muistityypin
- ei hyväksy muistia automaattisesti
- ei kirjoita Memory-tauluun suoraan

=====================================
*/


import {
  createMemoryProposal,
} from "../../memoryProposalService.js"

import {
  createBrainModule,
} from "../moduleContract.js"



const MEMORY_TRIGGERS = [
  "muista tämä",
  "muista että",
  "muista, että",
  "tallenna tämä muistiin",
  "haluan että muistat",
  "haluan muistaa",
  "haluan muistaa tämän",
  "haluan muistaa että",
  "haluan muistaa, että",
  "laita muistiin",
]



function normalizeMessage(message) {

  return String(
    message || "",
  )
    .trim()
    .toLowerCase()

}



function extractMemoryContent(message) {

  let content =
    String(
      message || "",
    )
      .trim()


  for (
    const trigger
    of MEMORY_TRIGGERS
  ) {

    if (
      content
        .toLowerCase()
        .startsWith(trigger)
    ) {

      content =
        content
          .slice(
            trigger.length,
          )
          .trim()

      break

    }

  }


  return content

}



function analyzeMemoryLearning(message) {

  const normalized =
    normalizeMessage(
      message,
    )


  const matched =
    MEMORY_TRIGGERS.some(
      trigger =>
        normalized.startsWith(
          trigger,
        ),
    )


  if (!matched) {

    return {

      matched:false,

      confidence:0,

      content:null,

    }

  }


  return {

    matched:true,

    confidence:1,

    content:
      extractMemoryContent(
        message,
      ),

  }

}



function classifyMemoryCategory(
  content,
) {

  const text =
    normalizeMessage(
      content,
    )


  if (
    text.includes("suomen kieli") ||
    text.includes("suomea") ||
    text.includes("kieli") ||
    text.includes("suomal")
  ) {

    return "language"

  }



  if (
    text.includes("wood-booster") ||
    text.includes("spacemonkey") ||
    text.includes("identiteetti") ||
    text.includes("olen")
  ) {

    return "identity"

  }



  if (
    text.includes("haluan") ||
    text.includes("pidän") ||
    text.includes("käytän") ||
    text.includes("aina")
  ) {

    return "preference"

  }



  if (
    text.includes("projekti") ||
    text.includes("tuote") ||
    text.includes("suunnittelu") ||
    text.includes("kehitys")
  ) {

    return "project"

  }



  return "general"

}



function createMemoryKey(content) {

  return String(
    content,
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9äöå]+/gi,
      "_",
    )
    .replace(
      /^_|_$/g,
      "",
    )
    .slice(
      0,
      80,
    )

}



function createMemoryLearningModule() {

return createBrainModule({

id:
  "memory-learning",


name:
  "Memory Learning Module",


version:
  "1.1.0",


description:
  "Luo ja luokittelee uusia muistiehdotuksia käyttäjän muistipyynnöistä.",


priority:
  20,



canHandle({
 request,
}) {


const analysis =
  analyzeMemoryLearning(
    request?.message,
  )


return {

matched:
  analysis.matched,


confidence:
  analysis.confidence,


reason:
  analysis.matched
    ? "Käyttäjä pyysi uuden tiedon muistamista."
    : "Ei tunnistettu muistamisen pyyntöä.",


metadata:
  analysis,

}


},



async execute({

message,

request,

runtimeContext,

}) {


const analysis =
  analyzeMemoryLearning(
    message,
  )



if (
 !analysis.matched
) {

throw new Error(
 "Memory Learning Module ei tunnistanut muistipyyntöä.",
)

}



const prisma =
  runtimeContext?.prisma



if (!prisma) {

throw new Error(
 "Memory Learning Module tarvitsee Prisma-yhteyden.",
)

}



const category =
  classifyMemoryCategory(
    analysis.content,
  )



const proposal =
 await createMemoryProposal({

 prismaClient:
   prisma,


 memory: {

 category,


 key:
   createMemoryKey(
     analysis.content,
   ),


 content:
   analysis.content,


 importance:
   8,

 },

})



return {

type:
 "memory_learning_result",


answer:
 "Muistiehdotus luotu ja odottaa hyväksyntää.",


category,


proposal,


requestId:
 request.requestId,

}


},

})

}



export {

 analyzeMemoryLearning,

 classifyMemoryCategory,

 createMemoryLearningModule,

}
