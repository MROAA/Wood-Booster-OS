const MODULE_ID =
  "system-awareness-graph"



import {

  collectSystemAwareness

} from "./systemAwarenessAdapter.js"



import {

  analyzeSystemState

} from "./systemStateReasoning.js"



import {

  analyzeFutureDirection

} from "./predictiveAwareness.js"



import {

  generateAdaptiveInsight

} from "./adaptiveInsight.js"



import {

  correlateKnowledge

} from "./knowledgeCorrelation.js"



import {

  analyzeContext

} from "./contextualReasoning.js"



import {

  analyzeStrategy

} from "./strategicReasoning.js"



import {

  analyzeDecisionSupport

} from "./decisionSupport.js"



import {

  createPlanningSupport

} from "./planningSupport.js"







function createSystemAwarenessGraph(){


  const liveAwareness =
    collectSystemAwareness()





  const reasoning =

    analyzeSystemState({

      modules:

        liveAwareness
          .liveSystem
          .liveGraph
          .modules
          .count,


      dependencies:

        liveAwareness
          .liveSystem
          .liveGraph
          .dependencies
          .state,


      capabilities:

        liveAwareness
          .liveSystem
          .liveGraph
          .capabilities
          .state,


      health:

        liveAwareness
          .liveSystem
          .liveGraph
          .health
          .state

    })







  const prediction =

    analyzeFutureDirection({

      modules:

        liveAwareness
          .liveSystem
          .liveGraph
          .modules
          .count,


      health:

        liveAwareness
          .liveSystem
          .liveGraph
          .health
          .state,


      learning:

        "active",


      evolution:

        "active",


      improvement:

        "active"

    })







  const insight =

    generateAdaptiveInsight({

      observations:

        reasoning
          .reasoning
          .observations,


      predictions:

        prediction
          .prediction
          .futureDirection,


      recommendations:

        prediction
          .prediction
          .recommendations

    })







  const knowledgeCorrelation =

    correlateKnowledge({

      observations:

        reasoning
          .reasoning
          .observations,


      insights:

        insight
          .insight
          .insights,


      memoryState:

        "active",


      knowledgeState:

        "active"

    })







  const contextualReasoning =

    analyzeContext({

      correlations:

        knowledgeCorrelation
          .correlation
          .correlations,


      signals:

        knowledgeCorrelation
          .correlation
          .knowledgeSignals,


      systemState:

        "stable",


      developmentState:

        "active"

    })







  const strategicReasoning =

    analyzeStrategy({

      contexts:

        contextualReasoning
          .context
          .contexts,


      interpretations:

        contextualReasoning
          .context
          .interpretations,


      recommendations:

        contextualReasoning
          .context
          .recommendations

    })







  const decisionSupport =

    analyzeDecisionSupport({

      contexts:

        contextualReasoning
          .context
          .contexts,


      directions:

        strategicReasoning
          .strategy
          .directions,


      priorities:

        strategicReasoning
          .strategy
          .priorities

    })







  const planningSupport =

    createPlanningSupport({

      options:

        decisionSupport
          .decisionSupport
          .options,


      impacts:

        decisionSupport
          .decisionSupport
          .impacts,


      directions:

        strategicReasoning
          .strategy
          .directions

    })







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

            "capability-registry",

            "memory-intelligence",

            "knowledge-intelligence"

          ],



        liveAwareness,



        reasoning,



        prediction,



        insight,



        knowledgeCorrelation,



        contextualReasoning,



        strategicReasoning,



        decisionSupport,



        planningSupport,



        awareness:

          [

            "Tunnistaa järjestelmän komponentteja",

            "Ymmärtää moduulien välisiä suhteita",

            "Seuraa järjestelmän kehitysrakennetta",

            "Arvioi järjestelmän tilaa",

            "Arvioi tulevaa kehityssuuntaa",

            "Muodostaa adaptiivisia havaintoja",

            "Yhdistää havaintoja tietokerroksiin",

            "Tulkitsee havaintoja kontekstissa",

            "Arvioi strategisia kehityssuuntia",

            "Tukee päätöksentekoa",

            "Muodostaa kehityssuunnitelmia päätöksenteon tueksi"

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