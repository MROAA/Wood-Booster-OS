/*
==================================================

WOOD-BOOSTER TRUTH BUNDLE

Yhdistää virallisen tiedon AI Brainille.

AI Brain käyttää tätä kerrosta.

Truth valitaan kysymyksen
tarkoituksen perusteella.

==================================================
*/


import {
  getTruthAnswer
} from "./truthRouter.js"



import {
  WORKSHOP_TRUTH
} from "./workshopTruth.js"





export function getTruthBundle(message) {


  const truths = []



  const text =

    String(message || "")

      .toLowerCase()

      .trim()





/*
==================================================
WORKSHOP TRUTH

Valmistus ennen tuotetietoa.

==================================================
*/


if (

  containsAny(

    text,

    [

      "valmist",

      "valmistaa",

      "valmistetaan",

      "työvaihe",

      "työvaiheet",

      "rakennan",

      "rakentaa",

      "teen",

      "tehdään",

      "työstö",

      "viimeistely",

      "valmistus"

    ]

  )

) {


truths.push({


source:

"WORKSHOP_TRUTH",



answer:

`

${WORKSHOP_TRUTH.process}



${WORKSHOP_TRUTH.quality}



${WORKSHOP_TRUTH.workflow}



${WORKSHOP_TRUTH.constraints}

`

})


}







/*
==================================================
PRODUCT TRUTH

Tuotteet ja ominaisuudet.

==================================================
*/


if (

containsAny(

text,

[

"tuote",

"pöytä",

"jokipöytä",

"jokipöydät",

"aurora",

"river table",

"materiaali",

"epoksi",

"ominaisuus"

]

)

&&

!

containsAny(

text,

[

"valmist",

"työvaihe",

"rakennan",

"työstö"

]

)

)

{


const productTruth =

getTruthAnswer(

"jokipöytä"

)



if(productTruth){


truths.push({

source:

"PRODUCT_TRUTH",


answer:

productTruth.answer


})


}


}








/*
==================================================
DECISION TRUTH

Hinnoittelu ja päätökset.

==================================================
*/


if (

containsAny(

text,

[

"hinta",

"hinnoittelu",

"hinnoitella",

"maksaa",

"kate",

"kannattavuus"

]

)

)

{


const decisionTruth =

getTruthAnswer(

"hinnoittelu"

)



if(decisionTruth){


truths.push({

source:

"DECISION_TRUTH",


answer:

decisionTruth.answer


})


}


}








if(

truths.length === 0

){

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
