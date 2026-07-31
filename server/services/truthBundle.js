/*
==================================================

WOOD-BOOSTER TRUTH BUNDLE

Rakenteinen Truth-kerros.

Sisältää:
- faktat
- käyttötarkoituksen
- rajoitukset
- lähteen auktoriteetin

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







const asksManufacturing =

containsAny(

text,

[
"valmist",
"työvaihe",
"rakennan",
"rakentaa",
"työstö",
"viimeistely",
"miten tehdään",
"kuinka tehdään"
]

)








/*
==================================================
WORKSHOP TRUTH
==================================================
*/


if(asksManufacturing){


const answer = `

TRUTH AUTHORITY:

WORKSHOP_TRUTH on virallinen lähde.

Truth-tietoa saa käyttää vain valmistusajattelun
selittämiseen.

Jos tieto puuttuu, sitä ei täydennetä yleisellä tiedolla.



FAKTA:

${WORKSHOP_TRUTH.process.description}


${WORKSHOP_TRUTH.quality.description}


${WORKSHOP_TRUTH.workflow.description}



KÄYTTÖTARKOITUS:

${WORKSHOP_TRUTH.process.allowedUse}


${WORKSHOP_TRUTH.workflow.allowedUse}



RAJOITUKSET:

${WORKSHOP_TRUTH.process.forbiddenUse}


${WORKSHOP_TRUTH.workflow.forbiddenUse}


${WORKSHOP_TRUTH.constraints.description}



PUUTTUU:

Yksityiskohtaisia valmistusvaiheita ei ole määritelty ilman erillistä lähdettä.

`





truths.push({

source:"WORKSHOP_TRUTH",

answer,


facts:[

WORKSHOP_TRUTH.process.description,

WORKSHOP_TRUTH.quality.description,

WORKSHOP_TRUTH.workflow.description

],


rules:[

WORKSHOP_TRUTH.process.forbiddenUse,

WORKSHOP_TRUTH.workflow.forbiddenUse,

WORKSHOP_TRUTH.constraints.description

],


limitations:[

"Yksityiskohtaisia valmistusvaiheita ei ole määritelty ilman erillistä lähdettä."

]

})


}









/*
==================================================
PRODUCT TRUTH
==================================================
*/


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

){


const productTruth =

getTruthAnswer(

"jokipöytä"

)



if(productTruth){


truths.push({

source:"PRODUCT_TRUTH",

answer:

`

TRUTH AUTHORITY:

PRODUCT_TRUTH on virallinen tuotetiedon lähde.



FAKTA:

${productTruth.answer}



KÄYTTÖ:

Tietoa saa käyttää tuotteen idean,
ominaisuuksien ja tarkoituksen selittämiseen.



RAJOITUS:

Tuotteen tarkkoja valmistusvaiheita,
materiaaleja, työkaluja tai työmenetelmiä
ei saa keksiä ilman vahvistettua lähdettä.



PUUTTUU:

Lisätietoja ei voida vahvistaa ilman Product Truth lähdettä.

`,

facts:[

productTruth.answer

],


rules:[

"Älä keksi tuotteen valmistusvaiheita.",

"Älä keksi materiaaleja tai työmenetelmiä."

],


limitations:[

"Tuotteen tarkat valmistusvaiheet vaativat erillisen vahvistetun lähteen."

]

})


}


}









if(truths.length === 0){

return null

}





return {

truths

}


}







function containsAny(text, words){

return words.some(

word =>

text.includes(word)

)

}