import {
  detectIntent,
} from "./spacemonkeyIntentEngine.js"


import {
  analyzeCodingRequest,
} from "./spacemonkeyCodingAnalyzer.js"


import {
  resolveCodingContext,
} from "./spacemonkeyCodingContextResolver.js"


import {
  inspectCodeFile,
} from "./spacemonkeyCodeInspection.js"


import {
  understandCode,
} from "./spacemonkeyCodeUnderstanding.js"


import {
  createCodeChangePlan,
} from "./spacemonkeyCodeChangePlanner.js"


import {
  runCodePipeline,
} from "./spacemonkeyCodePipeline.js"


import {
  evaluateInformation,
} from "./spacemonkeyTruthEngine.js"


import {
  evaluateAction,
} from "./spacemonkeyValueAlignment.js"


import {
  analyzeThinkingApproach,
} from "./spacemonkeyCognitiveStyle.js"


import {
  createInvestigation,
} from "./spacemonkeyCuriosityEngine.js"


import {
  evaluateDecision,
} from "../../../../../Spacemonkey/core/spacemonkeyDecisionBridge.js"


import {
  createPlan,
} from "../../../../../Spacemonkey/core/spacemonkeyPlanningBridge.js"


import {
  retrieveRelevantMemories,
} from "./spacemonkeyMemoryRetrieval.js"


import {
  findMemory,
  saveMemory,
} from "./spacemonkeyPersistentMemory.js"


import {
  evaluateMemoryImportance,
} from "./spacemonkeyMemoryIntelligence.js"


import {
  evaluateMemoryQuality,
} from "./spacemonkeyMemoryQuality.js"


import {
  createUserProfile,
} from "./spacemonkeyUserProfile.js"



const cycleHistory = []



async function runCognitiveCycle({

  message,

  prisma

}) {


  const context = {

    input:
      message,

    startedAt:
      new Date().toISOString()

  }



  const intent =
    detectIntent({
      message
    })



  let codingAnalysis = null

  let codingContext = null

  let codeInspection = null

  let codeUnderstanding = null

  let codeChangePlan = null

  let codePipeline = null



  if(
    intent.intent === "CODING_REQUEST"
  ){


    codingAnalysis =
      analyzeCodingRequest({
        message
      })


    codingContext =
      resolveCodingContext({
        codingAnalysis
      })


    if(
      codingContext?.filePath
    ){


      codeInspection =
        inspectCodeFile({
          filePath:
            codingContext.filePath
        })


      if(
        codeInspection.exists
      ){


        const fsModule =
          await import("fs")


        const pathModule =
          await import("path")


        const sourcePath =
          pathModule.default.join(
            process.cwd(),
            "..",
            codingContext.filePath
          )


        const sourceCode =
          fsModule.default.readFileSync(
            sourcePath,
            "utf-8"
          )
        codeUnderstanding =
          understandCode({

            filePath:
              codingContext.filePath,

            sourceCode

          })


        codeChangePlan =
          createCodeChangePlan({

            codingContext,

            codeUnderstanding,

            instruction:
              message

          })


        codePipeline =
          await runCodePipeline({

            prisma,

            codingContext,

            codeUnderstanding,

            codeChangePlan,

            sourceCode,

            instruction:
              message

          })

      }

    }

  }





  const allMemories =
    await findMemory({
      prisma
    })



  const recalledMemory =
    retrieveRelevantMemories({

      query:
        message,

      memories:
        allMemories

    })



  const memoryContext =
    recalledMemory.memories || []



  const userProfile =
    createUserProfile({

      memories:
        memoryContext

    })



  const memoryEvaluation =
    evaluateMemoryImportance({

      content:
        message

    })



  const memoryQuality =
    evaluateMemoryQuality({

      existingMemories:
        allMemories,

      content:
        message

    })



  let savedMemory = {

    saved:false

  }



  if(

    memoryEvaluation.shouldSave &&

    memoryQuality.accepted &&

    prisma

  ){

    savedMemory =
      await saveMemory({

        prisma,

        key:
          `spacemonkey-${Date.now()}`,

        content:
          message,

        importance:
          memoryEvaluation.importance

      })

  }





  const thinking =
    analyzeThinkingApproach({

      problem:
        message,

      memoryContext

    })



  const truth =
    evaluateInformation({

      information:
        message

    })



  const investigation =
    createInvestigation({

      topic:
        message,

      reason:
        "Arvioidaan tarvitseeko lisää tietoa.",

      importance:
        0.5

    })



  const values =
    evaluateAction({

      action:

`
Autan käyttäjää.

Toimin totuudenmukaisesti.

Vältän keksittyä tietoa.

Teen selkeitä ratkaisuja.

Etenen turvallisesti.

Käyttäjän pyyntö:

${message}
`

    })





  const decision =
    evaluateDecision({

      options:

      [

        {

          name:
            "Analysoi, suunnittele ja auta käyttäjää",

          truthScore:
            truth.confidence,

          goalAlignment:
            0.8,

          valueAlignment:
            values.score,

          risk:
            0.1

        }

      ]

    })





  const plan =
    createPlan({

      goal:
        message,

      decision:
        decision.decision.selected

    })





  const cycle = {


    status:
      "completed",


    context,


    intent,


    codingAnalysis,


    codingContext,


    codeInspection,


    codeUnderstanding,


    codeChangePlan,


    codePipeline,


    userProfile,


    memory:

    {

      recalled:
        recalledMemory,


      evaluation:
        memoryEvaluation,


      quality:
        memoryQuality,


      saved:
        savedMemory

    },


    thinking,


    truth,


    investigation,


    values,


    decision,


    plan,


    completedAt:
      new Date().toISOString()

  }



  cycleHistory.push(
    cycle
  )



  return cycle

}





function getCycleHistory(){

  return [

    ...cycleHistory

  ]

}





function getCycleStatus(){

  return {

    engine:
      "Spacemonkey Cognitive Cycle",

    version:
      "1.4.0",

    cycles:
      cycleHistory.length

  }

}





export {

  runCognitiveCycle,

  getCycleHistory,

  getCycleStatus

}
