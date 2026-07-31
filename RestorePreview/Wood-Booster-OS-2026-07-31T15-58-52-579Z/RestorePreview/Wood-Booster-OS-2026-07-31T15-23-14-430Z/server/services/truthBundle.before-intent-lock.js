/*
==================================================

WOOD-BOOSTER TRUTH BUNDLE

Rakenteinen Truth-kerros.

AI Brain yhteensopiva.

==================================================
*/


import {
  getTruthAnswer
} from "./truthRouter.js"



import {
  WORKSHOP_TRUTH
} from "./workshopTruth.js"





export function getTruthBundle(message){


const truths = []


const text =

String(message || "")

.toLowerCase()

.trim()






if(

containsAny(

text,

[
"valmist",
"työvaihe",
"rakennan",
"rakentaa",
"työstö",
"viimeistely"
]

)

){


const facts = [

WORKSHOP_TRUTH.process,

WORKSHOP_TRUTH.quality,

WORKSHOP_TRUTH.workflow

]


const rules = [

WORKSHOP_TRUTH.constraints

]


const limitations = [

"Yksityiskohtaisia työvaiheita ei ole määritelty ilman erillistä lähdettä."

]





const answer =

`

FAKTA:

${facts.join("\n\n")}



RAJOITUKSET:

${rules.join("\n\n")}



PUUTTUU:

${limitations.join("\n\n")}

`





truths.push({

source:

"WORKSHOP_TRUTH",


answer,


facts,


rules,


limitations


})


}







if(

containsAny(

text,

[
"tuote",
"pöytä",
"jokipöytä",
"aurora"
]

)

&&

!containsAny(

text,

[
"valmist",
"työvaihe",
"rakennan"
]

)

){



const productTruth =

getTruthAnswer(

"jokipöytä"

)



if(productTruth){



const facts = [

productTruth.answer

]



const limitations = [

"Lisätietoja ei voida vahvistaa ilman Product Truth lähdettä."

]



truths.push({

source:

"PRODUCT_TRUTH",


answer:

`

FAKTA:

${facts.join("\n\n")}



PUUTTUU:

${limitations.join("\n\n")}

`,

facts,


rules:[],


limitations


})


}


}







if(truths.length===0){

return null

}





return {

truths

}


}







function containsAny(

text,

words

){

return words.some(

word =>

text.includes(word)

)

}
