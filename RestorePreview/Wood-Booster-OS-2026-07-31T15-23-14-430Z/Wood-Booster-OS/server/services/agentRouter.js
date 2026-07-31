/*
=====================================

WOOD-BOOSTER AGENT ROUTER

Ohjaa käyttäjän kysymykset
oikealle AI-agentille.

AI Brain pysyy muuttumattomana.

=====================================
*/


export function routeAgent(message){


const text =

String(message || "")

.toLowerCase()





/*
=====================================
SPACEMONKEY CORE AGENT
=====================================
*/


if(

text.includes("spacemonkey")

||

text.includes("kuka olet")

||

text.includes("mikä olet")

||

text.includes("kerro itsestäsi")

||

text.includes("identiteetti")

||

text.includes("persoonasi")

){


return {

agent:

"spacemonkey",


reason:

"spacemonkey identity question"

}


}







/*
=====================================
PRICING AGENT
=====================================
*/


if(

text.includes("hinta")

||

text.includes("hinno")

||

text.includes("kate")

||

text.includes("maksaa")

||

text.includes("tarjous")

||

text.includes("kannattavuus")

){


return {

agent:

"pricing",


reason:

"pricing question"

}


}







/*
=====================================
WORKSHOP AGENT
=====================================
*/


if(

text.includes("valmist")

||

text.includes("työvaihe")

||

text.includes("rakennan")

||

text.includes("teen")

){


return {

agent:

"workshop",


reason:

"workshop question"

}


}









/*
=====================================
PRODUCT AGENT
=====================================
*/


if(

text.includes("tuote")

||

text.includes("pöytä")

||

text.includes("jokipöytä")

||

text.includes("materiaali")

||

text.includes("puu")

||

text.includes("epoksi")

){

return {

agent:

"product",

reason:

"product question"

}

}




/*
=====================================
MARKETING AGENT
=====================================
*/


if(

text.includes("instagram")

||

text.includes("mainos")

||

text.includes("teksti")

||

text.includes("markkinointi")

||

text.includes("julkaisu")

){


return {

agent:

"marketing",


reason:

"marketing question"

}


}







/*
=====================================
CRM AGENT
=====================================
*/


if(

text.includes("asiakas")

||

text.includes("crm")

||

text.includes("yhteystieto")

){


return {

agent:

"crm",


reason:

"customer question"

}


}







/*
=====================================
DEFAULT

AI Brain

=====================================
*/


return {

agent:

"general",


reason:

"no specialized agent"

}


}
