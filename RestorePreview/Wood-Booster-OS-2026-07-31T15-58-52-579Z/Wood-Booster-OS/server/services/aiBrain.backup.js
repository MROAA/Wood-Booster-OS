import {
  filterSystemFiles,
} from "./systemFilter.js"


import {
  buildAIContext,
} from "./contextBuilder.js"


import {
  extractMemory,
} from "./memoryExtractor.js"


import {
  createMemoryProposal,
} from "./memoryProposalService.js"


import {
  getMemory,
} from "./memoryService.js"


import {
  validateAIResponse,
} from "./aiQualityControl.js"


import {
  validateGrounding,
} from "./aiGroundingValidator.js"


import {
  validateBrandIdentity,
} from "./brandIdentityGuard.js"


import {
  validateResponseStyle,
} from "./responseStyleGuard.js"


import {
  validatePhilosophyAnswer,
} from "./philosophyGuard.js"


import {
  validateKnowledgeBoundary,
} from "./knowledgeBoundaryGuard.js"


import {
  readDatabaseKnowledge,
} from "./databaseKnowledgeReader.js"


import {
  getTruthBundle,
} from "./truthBundle.js"





const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://localhost:11434"



const DEFAULT_MODEL =
  process.env.OLLAMA_MODEL ||
  "qwen2.5:7b"








export async function runAIBrain({

  message,

  knowledge = [],

  conversation = [],

  model = DEFAULT_MODEL,

  prisma,

}) {


try {



/*
=====================================
1. TRUTH BUNDLE
=====================================
*/


const truthBundle =

  getTruthBundle(

    message

  )





let truthContext = ""





if (

  truthBundle &&

  truthBundle.truths.length > 0

) {


truthContext =

`

=====================================
WOOD-BOOSTER OFFICIAL TRUTH
=====================================


${

truthBundle.truths

.map(

truth =>


`

SOURCE:

${truth.source}



${truth.answer}

`

)

.join("\n")

}



=====================================

`

}






/*
=====================================
2. SYSTEM FILES
=====================================
*/


const systems =

await filterSystemFiles(

message

)






/*
=====================================
3. DATABASE KNOWLEDGE
=====================================
*/


let databaseKnowledge = []



if(prisma){


databaseKnowledge =

await readDatabaseKnowledge({

prisma,

message

})


}




knowledge = [

...knowledge,

...databaseKnowledge

]
/*
=====================================
4. MEMORY
=====================================
*/


const memories =

await getMemory({

limit:10

})







/*
=====================================
5. BUILD CONTEXT
=====================================
*/


const context =

await buildAIContext({

message,

knowledge,

memory:memories,

conversation

})






const finalContext =

`

${truthContext}



${context}



WOOD-BOOSTER AI RULES:


- Vastaa Wood-Boosterin näkökulmasta.
- Käytä virallista tietoa.
- Älä keksi uusia arvoja.
- Älä anna tarkkoja hintoja ilman laskelmia.
- Jos tietoa puuttuu, kerro mitä tarvitaan.



`






/*
=====================================
6. OLLAMA
=====================================
*/


let answer =

await askOllama({

model,

context:finalContext,

message

})







/*
=====================================
7. VALIDATION
=====================================
*/


let quality =

validateAIResponse({

answer,

knowledge,

memories

})



let grounding =

validateGrounding({

answer,

knowledge

})



let brandIdentity =

validateBrandIdentity(

answer

)



let responseStyle =

validateResponseStyle(

answer

)



let philosophy =

validatePhilosophyAnswer(

message,

answer

)



let knowledgeBoundary =

validateKnowledgeBoundary(

answer

)





let repairAttempts = 0







/*
=====================================
8. REPAIR LOOP
=====================================
*/


while (

repairAttempts < 3 &&

(

!quality.approved ||

!grounding.valid ||

!brandIdentity.valid ||

!responseStyle.valid ||

!philosophy.valid ||

!knowledgeBoundary.valid

)

) {



answer =

await askOllama({

model,


context:

`

Korjaa vastaus.



WOOD-BOOSTER VIRALLINEN TIETO:


${truthContext}



Säännöt:


- Älä keksi tietoa.
- Älä keksi arvoja.
- Käytä vain annettua tietoa.
- Vastaa lyhyesti.
- Älä anna tarkkaa hintaa ilman kustannustietoja.



Kysymys:

${message}



Nykyinen vastaus:

${answer}

`,

message

})



repairAttempts++





quality =

validateAIResponse({

answer,

knowledge,

memories

})



grounding =

validateGrounding({

answer,

knowledge

})



brandIdentity =

validateBrandIdentity(

answer

)



responseStyle =

validateResponseStyle(

answer

)



philosophy =

validatePhilosophyAnswer(

message,

answer

)



knowledgeBoundary =

validateKnowledgeBoundary(

answer

)



}
/*
=====================================
9. MEMORY EXTRACTION
=====================================
*/


let memoryProposal = null

let memoryProposalCreated = false





const extracted =

await extractMemory({

conversation:

`

USER:

${message}



ASSISTANT:

${answer}

`

})






if (

extracted?.shouldSave &&

prisma

) {



memoryProposal =

await createMemoryProposal({

category:

extracted.category,


key:

extracted.key,


content:

extracted.content,


importance:

extracted.importance

})



memoryProposalCreated =

Boolean(memoryProposal)


}









/*
=====================================
10. FINAL RESPONSE
=====================================
*/


return {


success:true,


answer,


model,



memoryProposalCreated,


memoryProposal,



knowledgeSources:


[


...(truthBundle

?

truthBundle.truths.map(

truth =>

truth.source

)

:

[]),



...knowledge.map(

item =>

item.name ||

item.title ||

item.file ||

"unknown"

)


],




debug:{


truthLayer:

Boolean(truthBundle),



truthSources:

truthBundle

?

truthBundle.truths.map(

truth =>

truth.source

)

:

[],



systemsLoaded:

systems.length,



databaseKnowledgeLoaded:

databaseKnowledge.length,



memoryLoaded:

memories.length,



contextLength:

finalContext.length,



repairAttempts,



quality,


grounding,


brandIdentity,


responseStyle,


philosophy,


knowledgeBoundary


}


}



}



catch(error){


console.error(

"AI BRAIN ERROR:",

error

)



return {


success:false,


error:error.message


}


}



}









async function askOllama({

model,

context,

message

}) {



const response =

await fetch(

`${OLLAMA_URL}/api/chat`,

{


method:"POST",


headers:{

"Content-Type":

"application/json"

},


body:JSON.stringify({


model,


stream:false,


messages:[


{

role:"system",

content:context

},


{

role:"user",

content:message

}


],


options:{


temperature:0.2,


num_ctx:8192


}


})


}

)








const data =

await response.json()






if(!response.ok){


throw new Error(

data.error ||

"Ollama error"

)


}






return String(

data.message?.content ||

""

).trim()


}
