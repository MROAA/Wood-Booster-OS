/*
==================================================

WOOD-BOOSTER TRUTH ROUTER v3

Virallisen tiedon reititin.

Tarkoitus:

- palauttaa oikea Truth-lähde
- estää väärän tiedon sekoittuminen
- pitää domainit erillään

Prioriteetti:

1. WORKSHOP
   Valmistus ja tekeminen

2. PRODUCT
   Tuotteet ja ominaisuudet

3. BRAND
   Identiteetti

4. BUSINESS
   Yritys

5. DECISION
   Päätösmallit

6. null

==================================================
*/


import {
  BRAND_TRUTH,
} from "./brandTruth.js"



import {
  BUSINESS_TRUTH,
} from "./businessTruth.js"



import {
  PRODUCT_TRUTH,
} from "./productTruth.js"



import {
  DECISION_TRUTH,
} from "./decisionTruth.js"





export function getTruthAnswer(message) {


const text =

String(message || "")

.toLowerCase()

.trim()





/*
==================================================
WORKSHOP TRUTH

Valmistus voittaa tuotteen.

==================================================
*/


if (

containsAny(

text,

[

"valmist",

"työvaihe",

"työvaiheet",

"rakennan",

"rakentaa",

"teen",

"tehdään",

"työstö",

"viimeistely"

]

)

)

{


return {


source:

"WORKSHOP_TRUTH",



domain:

"workshop",



priority:

100,



answer:

`

Wood-Boosterin valmistus perustuu
materiaalin ymmärtämiseen ja
yksilölliseen työskentelyyn.

Työvaiheet suunnitellaan
projektin tarpeiden mukaan.

Laatu, materiaalin kunnioittaminen
ja pitkäikäinen lopputulos
ovat valmistuksen periaatteita.

`

}


}








/*
==================================================
PRODUCT TRUTH

Tuotteet ja materiaalit.

==================================================
*/


if (

containsAny(

text,

[

"aurora",

"aurora-jokipöytä",

"jokipöytä",

"jokipöydät",

"river table",

"river-table",

"pöytä",

"pöydät"

]

)

)

{


return {


source:

"PRODUCT_TRUTH",



domain:

"product",



priority:

90,



answer:

PRODUCT_TRUTH.riverTables


}


}








if (

containsAny(

text,

[

"materiaali",

"materiaalit",

"puu",

"epoksi",

"epoxy"

]

)

)

{


return {


source:

"PRODUCT_TRUTH",



domain:

"product",



priority:

80,



answer:

PRODUCT_TRUTH.materials


}


}









/*
==================================================
BRAND TRUTH

==================================================
*/


if (

containsAny(

text,

[

"arvot",

"arvo"

]

)

)

{


return {


source:

"BRAND_TRUTH",



domain:

"brand",



priority:

100,



answer:

BRAND_TRUTH.values


}


}






if (

containsAny(

text,

[

"filosofia",

"ydinajatus",

"identiteetti",

"visio",

"miksi wood-booster",

"miksi wood booster"

]

)

)

{


return {


source:

"BRAND_TRUTH",



domain:

"brand",



priority:

100,



answer:

BRAND_TRUTH.philosophy


}


}







if (

containsAny(

text,

[

"slogan",

"lause"

]

)

)

{


return {


source:

"BRAND_TRUTH",



domain:

"brand",



priority:

90,



answer:

BRAND_TRUTH.sentence


}


}









/*
==================================================
BUSINESS TRUTH

==================================================
*/


if (

containsAny(

text,

[

"yritys",

"liiketoiminta",

"mitä wood-booster valmistaa",

"mitä wood booster valmistaa",

"mitä valmistatte"

]

)

)

{


return {


source:

"BUSINESS_TRUTH",



domain:

"business",



priority:

100,



answer:

BUSINESS_TRUTH.products


}


}








/*
==================================================
DECISION TRUTH

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


return {


source:

"DECISION_TRUTH",



domain:

"decision",



priority:

70,



answer:

DECISION_TRUTH.pricing


}


}






if (

containsAny(

text,

[

"kannattaako",

"päätös",

"valita"

]

)

)

{


return {


source:

"DECISION_TRUTH",



domain:

"decision",



priority:

60,



answer:

DECISION_TRUTH.problemSolving


}


}







return null


}







function containsAny(

text,

words

)

{


return words.some(

word =>

text.includes(word)

)


}