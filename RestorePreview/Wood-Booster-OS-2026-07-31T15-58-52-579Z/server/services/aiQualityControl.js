/*
==================================================

WOOD-BOOSTER AI QUALITY CONTROL

Tarkistaa:

- vastaus on olemassa
- liian varmat väitteet
- liiketoimintatermit
- hinnat
- prosentit
- Truth-lähteen vastaiset väitteet

==================================================
*/


export function validateAIResponse({

  answer,

  knowledge = [],

  memories = [],

} = {}) {



const warnings = []



const lowerAnswer =

String(answer || "")

.toLowerCase()

.trim()





if(!lowerAnswer){


return createResult([

{

type:"empty_answer",

message:"AI palautti tyhjän vastauksen."

}

])


}







/*
=====================================
KNOWLEDGE
=====================================
*/


const knowledgeText =

knowledge

.map(item =>

String(

item?.content ||

""

)

)

.join(" ")

.toLowerCase()





const memoryText =

memories

.map(item =>

String(

item?.content ||

""

)

)

.join(" ")

.toLowerCase()





const availableContext =

`${knowledgeText} ${memoryText}`







/*
=====================================
TRUTH CONTEXT

=====================================
*/


const truthSources =

knowledge

.filter(item =>

item.name === "TRUTH_CONTEXT"

)

.map(item =>

String(item.content || "")

)

.join(" ")

.toLowerCase()









/*
=====================================
VARMAT HALLUSINAATIOT

=====================================
*/


const blockedPatterns = [

"perustettiin vuonna",

"tutkimusten mukaan",

"todistetusti",

"kaikki asiakkaat",

"markkinajohtaja",

"aina paras"

]





for(const pattern of blockedPatterns){


if(lowerAnswer.includes(pattern)){


warnings.push({

type:"possible_hallucination",

message:

`Liian varma väite: ${pattern}`

})


}


}










/*
=====================================
WORKSHOP CLAIM CHECK

Estetään:

- puulajit
- työkalut
- materiaalit
- valmistusmenetelmät

ilman lähdettä

=====================================
*/


const forbiddenWorkshopClaims = [


"tammi",

"koivu",

"mänty",

"puulaji",

"saha",

"hiom",

"jyrsin",

"höyl",

"työkalu",

"epoksi",

"hartsi",

"lakka",

"öljy"


]





for(const claim of forbiddenWorkshopClaims){


if(lowerAnswer.includes(claim)){



if(

!truthSources.includes(claim)

){


warnings.push({

type:"unsupported_workshop_claim",

message:

`Valmistusväite ei löydy Truth-lähteestä: ${claim}`

})


}


}



}









/*
=====================================
BUSINESS TERMS

=====================================
*/


const businessTerms = [

"hinnoittelu",

"materiaalikustannus",

"työkustannus",

"kate",

"toimitusaika"

]





for(const term of businessTerms){


if(

lowerAnswer.includes(term)

&&

!availableContext.includes(term)

){


warnings.push({

type:"unsupported_business_term",

message:

`${term} ei löytynyt lähteistä.`

})


}


}









/*
=====================================
RAHASUMMAT

=====================================
*/


const euroClaims =

lowerAnswer.match(

/\b\d+(?:[.,]\d+)?\s*(?:€|euroa|eur)\b/g

)

|| []





for(const claim of euroClaims){


if(

!availableContext.includes(

claim.toLowerCase()

)

){


warnings.push({

type:"unsupported_price",

message:

`Tarkalle hinnalle ei löytynyt lähdettä: ${claim}`

})


}


}









/*
=====================================
PROSENTIT

=====================================
*/


const percentageClaims =

lowerAnswer.match(

/\b\d+(?:[.,]\d+)?\s*%/g

)

|| []





for(const claim of percentageClaims){


if(

!availableContext.includes(

claim.toLowerCase()

)

){


warnings.push({

type:"unsupported_percentage",

message:

`Prosentille ei löytynyt lähdettä: ${claim}`

})


}


}









return createResult(

warnings

)


}








function createResult(warnings){


const approved =

warnings.length === 0





return {


approved,


valid:

approved,


warnings,



score:

Math.max(

0,

100 -

warnings.length * 15

)


}


}
