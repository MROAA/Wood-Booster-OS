/*
=====================================

WOOD-BOOSTER AI BRAIN V2

MEMORY LEARNING MODULE

Vastuut:

- tunnistaa käyttäjän suoran muistipyynnön
- luo MemoryProposal-ehdotuksen
- ei hyväksy muistia automaattisesti
- ei kirjoita Memory-tauluun

Memory Module:
= muistin hallinta

Memory Learning Module:
= uuden tiedon oppiminen

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
  "laita muistiin",
]


function normalizeMessage(
  message,
) {
  return String(
    message || "",
  )
    .trim()
    .toLowerCase()
}


function extractMemoryContent(
  message,
) {
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
        content.slice(
          trigger.length,
        )
        .trim()

      break
    }
  }


  return content
}


function analyzeMemoryLearning(
  message,
) {
  const normalized =
    normalizeMessage(
      message,
    )


  const matched =
    MEMORY_TRIGGERS.some(
      (trigger) =>
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


function createMemoryKey(
  content,
) {
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


function createMemoryLearningModule(){

return createBrainModule({

id:
  "memory-learning",

name:
  "Memory Learning Module",

version:
  "1.0.0",

description:
  "Luo uusia muistiehdotuksia käyttäjän suorista muistipyynnöistä.",


priority:
  20,


canHandle({
 request,
}){

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
}){


const analysis =
  analyzeMemoryLearning(
    message,
  )


if (
 !analysis.matched
){
 throw new Error(
  "Memory Learning Module ei tunnistanut muistipyyntöä.",
 )
}


const prisma =
  runtimeContext?.prisma


if (!prisma){

throw new Error(
 "Memory Learning Module tarvitsee Prisma-yhteyden.",
)

}


const proposal =
 await createMemoryProposal({

 prismaClient:
   prisma,

 memory:{

 category:
   "project",

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

proposal,

requestId:
 request.requestId,

}

},

})

}


export {
 analyzeMemoryLearning,
 createMemoryLearningModule,
}
