/*
=====================================

WOOD-BOOSTER AGENT EXECUTOR

Yhdistää:
- agentRouter
- agent contextit
- AI Brain

AI Brain pysyy muuttumattomana.

=====================================
*/


import {
  routeAgent
} from "./agentRouter.js"



import {
  buildPricingContext
} from "./agents/pricingAgent.js"


import {
  buildProductContext
} from "./agents/productAgent.js"





export function buildAgentContext(message){


const route =

routeAgent(message)




let agentContext = ""





switch(route.agent){


case "pricing":


agentContext =

buildPricingContext()

break





case "product":


agentContext =

buildProductContext()

break






case "marketing":


agentContext =

`

WOOD-BOOSTER MARKETING AGENT


Käytä:

- Wood-Boosterin ääntä
- aitoutta
- puun tarinaa


Älä käytä yleisiä markkinointilauseita.

`

break






case "crm":


agentContext =

`

WOOD-BOOSTER CRM AGENT


Toimi asiakasprojektien avustajana.

`

break






case "workshop":


agentContext =

`

WOOD-BOOSTER WORKSHOP AGENT


Keskity valmistukseen ja työvaiheisiin.

`

break






default:


agentContext = ""



}





return {


agent:

route.agent,


reason:

route.reason,


context:

agentContext


}


}
