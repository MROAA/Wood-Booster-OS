/*
=====================================

WOOD-BOOSTER AGENT EXECUTOR

Yhdistää:
- agentRouter
- agent contextit
- truth layer
- grounding layer
- Spacemonkey Identity Modules

=====================================
*/


import {
  routeAgent
} from "./agentRouter.js"



import {
  getTruthBundle
} from "./truthBundle.js"



import {
  buildPricingContext
} from "./agents/pricingAgent.js"



import {
  buildProductContext
} from "./agents/productAgent.js"



import {
  buildWorkshopContext
} from "./agents/workshopAgent.js"



import {
  buildGroundedContext
} from "./grounding/groundingEngine.js"



import {
  loadGodFiles
} from "./aiBrainV2/system/spacemonkey/spacemonkeyGodFileLoader.js"



import {
  handleIdentity
} from "./spacemonkey/identityBridge.js"



import {
  protectIdentityResponse
} from "./spacemonkey/identityGuard.js"







export async function buildAgentContext(message){


  const identity =

    handleIdentity(
      message
    )





  let route





  if(identity.matched){

    route = {

      agent:
        "spacemonkey",


      reason:
        "spacemonkey identity question"

    }

  }

  else {

    route =
      routeAgent(
        message
      )

  }





  console.log(
    "AGENT SELECTED:",
    route.agent
  )





  const truthBundle =

    getTruthBundle(
      message
    )





  let agentContext = ""



  let identityResponse = null

  if(identity.matched){

    const protectedIdentity =

      protectIdentityResponse(
        identity.response
      )


    if(
      protectedIdentity.protected
    ){

      return {

        agent:
          "spacemonkey",


        reason:
          "spacemonkey identity question",


        identityResponse:
          protectedIdentity.response,


        context:
          "",


        truth:
          null

      }

    }

  }


  switch(route.agent){



    case "spacemonkey":
    {


      const godFiles =

        await loadGodFiles()





      if(identity.matched){

        const protectedIdentity =

          protectIdentityResponse(
            identity.response
          )



        if(
          protectedIdentity.protected
        ){

          identityResponse =
            protectedIdentity.response

        }

      }





      agentContext =

`

==================================================
SPACEMONKEY IDENTITY LAYER
==================================================


Olet Spacemonkey.


Spacemonkey on henkilökohtainen
AI-käyttöjärjestelmän älykerros.


CREATOR AUTHORITY:


Spacemonkeyn luoja:

Marc Järvinen.


Marc Järvinen on:

- alkuperäinen luoja
- suunnittelija
- järjestelmän kehittäjä


IDENTITEETTISÄÄNTÖ:


Älä väitä ettet tiedä luojaasi.


Älä lisää muita luojia ilman lähdettä.



GODFILES:


${godFiles.godfiles
.map(

file =>

`
${file.file}

${file.data?.content || ""}

`

)
.join("\n")}


==================================================

`

      break

    }





    case "pricing":

      agentContext =
        buildPricingContext()

      break





    case "product":

      agentContext =
        buildProductContext()

      break





    case "workshop":

      agentContext =
        buildWorkshopContext()

      break





    default:

      agentContext = ""

  }





  const groundedContext =

    buildGroundedContext({

      message,

      truthBundle

    })







  return {


    agent:

      route.agent,


    reason:

      route.reason,


    identityResponse,


    context:

`

${agentContext}


${groundedContext}

`,


    truth:

      truthBundle

  }


}
