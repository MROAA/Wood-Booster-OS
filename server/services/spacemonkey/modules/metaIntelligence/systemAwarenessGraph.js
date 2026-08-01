const MODULE_ID =
  "system-awareness-graph"



import {

  collectSystemAwareness

} from "./systemAwarenessAdapter.js"





function createSystemAwarenessGraph(){


  return {


    moduleId:
      MODULE_ID,


    timestamp:
      new Date().toISOString(),



    graph:

      {


        state:
          "active",



        source:

          [

            "system-inventory",

            "module-dependency-map",

            "health-monitoring",

            "capability-registry"

          ],



        liveAwareness:

          collectSystemAwareness(),



        awareness:

          [

            "Tunnistaa järjestelmän komponentteja",

            "Ymmärtää moduulien välisiä suhteita",

            "Seuraa järjestelmän kehitysrakennetta",

            "Lukee järjestelmän tilaa turvallisesti"

          ],



        principles:

          [

            "Älä muuta lähdejärjestelmiä",

            "Käytä vain analyysitietoa",

            "Säilytä käyttäjän hallinta",

            "Raportoi ennen toimintaa"

          ],



        requiresApproval:
          true


      }


  }


}







function getSystemAwarenessState(){


  return {


    moduleId:
      MODULE_ID,


    state:
      "active",


    available:
      true,


    approvalRequired:
      true


  }


}







export {

  MODULE_ID,

  createSystemAwarenessGraph,

  getSystemAwarenessState

}
