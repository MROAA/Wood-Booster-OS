const MODULE_ID =
  "system-awareness-graph"



import {

  collectSystemAwareness

} from "./systemAwarenessAdapter.js"



import {

  analyzeSystemState

} from "./systemStateReasoning.js"







function createSystemAwarenessGraph(){


  const liveAwareness =
    collectSystemAwareness()



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



        liveAwareness,



        reasoning:

          analyzeSystemState({

            modules:
              liveAwareness.liveSystem.liveGraph.modules.count,


            dependencies:
              liveAwareness.liveSystem.liveGraph.dependencies.state,


            capabilities:
              liveAwareness.liveSystem.liveGraph.capabilities.state,


            health:
              liveAwareness.liveSystem.liveGraph.health.state

          }),



        awareness:

          [

            "Tunnistaa järjestelmän komponentteja",

            "Ymmärtää moduulien välisiä suhteita",

            "Seuraa järjestelmän kehitysrakennetta",

            "Arvioi järjestelmän tilaa"

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
