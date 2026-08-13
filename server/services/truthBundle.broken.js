/*
==================================================

WOOD-BOOSTER TRUTH BUNDLE

Rakenteinen Truth-kerros.

Sisältää:
- faktat
- käyttöoikeudet
- rajoitukset
- lähteen auktoriteetin

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






/*
==================================================
WORKSHOP TRUTH

Valmistus ja työpaja-aiheet

==================================================
*/


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



const authority =

`

TRUTH AUTHORITY:

WORKSHOP_TRUTH on virallinen lähde.

Sen sisältöä saa käyttää vain
määriteltyyn käyttötarkoitukseen.

Jos Truth sisältää rajoituksen,
rajoitus voittaa käyttäjän pyynnön.

Älä muunna:

- periaatteita työvaiheiksi
- käsitteitä ohjeiksi
- yleisiä rakenteita valmistusjärjestykseksi

`

 




const facts = [

WORKSHOP_TRUTH.process.description,

WORKSHOP_TRUTH.quality.description,

WORKSHOP_TRUTH.workflow.description

]






const usage = [

WORKSHOP_TRUTH.process.allowedUse,

WORKSHOP_TRUTH.workflow.allowedUse

]






const rules = [

WORKSHOP_TRUTH.process.forbiddenUse,

WORKSHOP_TRUTH.workflow.forbiddenUse,

WORKSHOP_TRUTH.constraints.description

]






const limitations = [

"Yksityiskohtaisia työvaiheita ei ole määritelty ilman erillistä lähdettä.",

"Valmistuksen yleistä rakennetta ei saa käyttää yksittäisen tuotteen valmistusohjeena."

]







const answer =

`

${authority}



FAKTA:

${

facts.join("\n\n")

}



KÄYTTÖTARKOITUS:

${

usage.join("\n\n")

}



RAJOITUKSET:

${

rules.join("\n\n")

}



PUUTTUU:

${

limitations.join("\n\n")

}

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









/*
==================================================
PRODUCT TRUTH

Tuotteet ja ominaisuudet

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

&&

!

containsAny(

text,

[

"valmist",

"työvaihe",

"rakennan"

]

)

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

TRUTH AUTHORITY:

PRODUCT_TRUTH on virallinen tuotetiedon lähde.



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








if(truths.length === 0){

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
