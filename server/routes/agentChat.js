import express from "express"


import {
  buildAgentContext,
} from "../services/agentExecutor.js"



import {
  runAIBrain,
} from "../services/aiBrain.js"



import {
  createActionPlanAnswer,
  planActions,
} from "../services/actionPlanner.js"



import {
  createSystemContextKnowledge,
} from "../services/systemContextKnowledge.js"



import {
  generateAIActions,
} from "../services/aiActionGenerator.js"



import {
  createLiveContextModule,
} from "../services/aiBrainV2/modules/liveContextModule.js"



import {
  checkTrigger,
} from "../services/spacemonkey/modules/personalityTrigger/index.js"



import {
  detectMode,
} from "../services/chatModes/detectMode.js"

import {
  processAltrako,
} from "../services/chatModes/altrako.js"

import {
  reflect,
} from "../services/chatModes/loreVoice.js"

import {
  loadChatHistory,
  appendChatTurn,
} from "../services/chatModes/chatHistory.js"







const liveContextModule =
  createLiveContextModule()



const navigationCommands = [

  {
    path: "/",

    label: "AI Workspace",

    keywords: [

      "avaa ai workspace",

      "avaa workspace",

      "siirry workspaceen",

      "näytä workspace",

      "avaa ai brain",

    ],

  },


  {
    path: "/dashboard",

    label: "Dashboard",

    keywords: [

      "avaa dashboard",

      "näytä dashboard",

      "siirry dashboardiin",

      "avaa etusivu",

      "näytä etusivu",

    ],

  },


  {
    path: "/projects",

    label: "Projektit",

    keywords: [

      "avaa projektit",

      "näytä projektit",

      "siirry projekteihin",

      "avaa projects",

      "show projects",

      "open projects",

    ],

  },


  {
    path: "/customers",

    label: "Asiakkaat",

    keywords: [

      "avaa asiakkaat",

      "näytä asiakkaat",

      "siirry asiakkaisiin",

      "avaa crm",

      "näytä crm",

      "open customers",

    ],

  },


  {
    path: "/knowledge",

    label: "Knowledge",

    keywords: [

      "avaa knowledge",

      "näytä knowledge",

      "avaa tietopankki",

      "näytä tietopankki",

      "siirry tietopankkiin",

    ],

  },


  {
    path: "/memory",

    label: "Muisti",

    keywords: [

      "avaa muisti",

      "näytä muisti",

      "siirry muistiin",

      "open memory",

    ],

  },


  {
    path: "/tools",

    label: "Työkalut",

    keywords: [

      "avaa työkalut",

      "näytä työkalut",

      "siirry työkaluihin",

      "avaa tools",

      "open tools",

    ],

  },


  {
    path: "/settings",

    label: "Asetukset",

    keywords: [

      "avaa asetukset",

      "näytä asetukset",

      "siirry asetuksiin",

      "avaa settings",

      "open settings",

    ],

  },

]







function normalizeMessage(message){

  return String(message || "")

    .trim()

    .toLowerCase()

    .replace(/[!?.,:;]/g,"")

    .replace(/\s+/g," ")

}







function createActionResponse(action){

  if(!action){

    return {

      action:null,

      actions:[],

    }

  }


  return {

    action,

    actions:[action],

  }

}







function createActionsResponse(actions){

  const safeActions =

    Array.isArray(actions)

      ? actions.filter(Boolean)

      : []



  return {

    action:

      safeActions[0] || null,


    actions:

      safeActions,

  }

}







function createEmptyActionResponse(){

  return {

    action:null,

    actions:[],

  }

}
function findNavigationCommand(message){

  const normalizedMessage =

    normalizeMessage(
      message
    )


  return navigationCommands.find(

    (command) =>

      command.keywords.some(

        (keyword) =>

          normalizedMessage === keyword

          ||

          normalizedMessage.startsWith(
            `${keyword} `,
          )

      )

  )

}







function getRequestedProjectName(message){

  const normalizedMessage =

    normalizeMessage(
      message
    )



  const patterns = [

    /^avaa projekti (.+)$/,

    /^avaa (.+) projekti$/,

    /^avaa (.+)-projekti$/,

    /^näytä projekti (.+)$/,

    /^näytä (.+) projekti$/,

    /^siirry projektiin (.+)$/,

    /^open project (.+)$/,

  ]





  for(
    const pattern
    of patterns
  ){

    const match =

      normalizedMessage.match(
        pattern
      )


    if(match?.[1]){

      return match[1]

        .trim()

        .replace(
          /^nimeltä /,
          "",
        )

    }

  }


  return null

}







async function findProjectByName(
  prisma,
  requestedName,
){

  const projects =

    await prisma.project.findMany({

      orderBy:{

        updatedAt:
          "desc",

      },

    })





  const normalizedRequestedName =

    normalizeMessage(
      requestedName
    )





  const exactMatch =

    projects.find(

      (project) =>

        normalizeMessage(
          project.name,
        )

        ===

        normalizedRequestedName

    )





  if(exactMatch){

    return {

      project:
        exactMatch,


      matches:[
        exactMatch,
      ],

    }

  }





  const partialMatches =

    projects.filter(

      (project)=>{

        const normalizedProjectName =

          normalizeMessage(
            project.name,
          )


        return (

          normalizedProjectName.includes(
            normalizedRequestedName,
          )

          ||

          normalizedRequestedName.includes(
            normalizedProjectName,
          )

        )

      }

    )





  return {

    project:

      partialMatches.length === 1

        ? partialMatches[0]

        : null,


    matches:

      partialMatches,

  }

}







/*
 * Hakee projektin avoimet tehtävät (keskeneräiset työvaiheet) ja
 * kevyen "viimeisin aktiviteetti" -katsauksen, jotta Spacemonkey
 * tietää ne osana Live Context -tilannekuvaa. Ei tee mitään jos
 * aktiivista projektia ei ole - ei ylimääräisiä tietokantakyselyjä
 * kun käyttäjä ei ole projektin kontekstissa (esim. Dashboard/AI
 * Workspace ilman valittua projektia).
 */
async function enrichRuntimeContextWithProjectData(
  runtimeContext,
  prisma,
){

  const projectId =
    Number(
      runtimeContext?.activeProject?.id
    )


  if(

    !Number.isInteger(projectId)

    ||

    !prisma

  ){

    return runtimeContext

  }


  try {

    const [
      openTasks,
      project,
      latestNote,
    ] =
      await Promise.all([

        prisma.projectWorkflowStep.findMany({

          where: {
            projectId,
            done: false,
          },

          orderBy: {
            id: "asc",
          },

          select: {
            id: true,
            title: true,
          },

        }),


        prisma.project.findUnique({

          where: {
            id: projectId,
          },

          select: {
            updatedAt: true,
          },

        }),


        prisma.note.findFirst({

          where: {
            projectId,
          },

          orderBy: {
            createdAt: "desc",
          },

          select: {
            content: true,
            createdAt: true,
          },

        }),

      ])


    return {

      ...runtimeContext,

      openTasks,

      recentActivity: {

        projectUpdatedAt:
          project?.updatedAt || null,

        latestNote:
          latestNote || null,

      },

    }

  }

  catch(error){

    console.error(
      "RUNTIME CONTEXT ENRICHMENT ERROR:",
      error,
    )

    return runtimeContext

  }

}




async function createRuntimeContextKnowledge(
  runtimeContext,
  prisma,
){

  if(

    !runtimeContext

    ||

    typeof runtimeContext !== "object"

  ){

    return null

  }



  try {

    const enrichedRuntimeContext =
      await enrichRuntimeContextWithProjectData(
        runtimeContext,
        prisma,
      )


    const liveContextResult =
      await liveContextModule.execute({

        request: {},

        runtimeContext:
          enrichedRuntimeContext,

      })

    return {

      name:
        "RUNTIME_CONTEXT",


      content:

        JSON.stringify(

          liveContextResult.snapshot,

          null,

          2,

        ),

    }

  } catch(error) {

    console.error(
      "LIVE CONTEXT MODULE ERROR:",
      error,
    )

    return {

      name:
        "RUNTIME_CONTEXT",


      content:

        JSON.stringify(

          runtimeContext,

          null,

          2,

        ),

    }

  }

}







/*
 * Altrako-tila: ei mene lainkaan Ollama/agent-putken läpi, pelkkä
 * suojelija-persoona (server/services/chatModes/altrako.js).
 */
function runAltrakoTurn(text){

  const altrako =
    processAltrako(text)

  return {

    status: 200,

    body: {

      success:true,

      agent:
        "altrako",

      reason:
        "altrako mode",

      answer:
        altrako.reply,

      ...createEmptyActionResponse(),

      altrako: {

        name:
          altrako.name,

        currentMood:
          altrako.currentMood,

        blockedCount:
          altrako.blockedCount,

      },

    },

  }

}



/*
 * Council-tila: Spacemonkey (tavallinen agent-putki) ja Altrako
 * vastaavat molemmat, ja vastaukset yhdistetään yhdeksi näkyväksi
 * vastaukseksi - sama idea kuin PR #11:n Python-puolen chat.py:ssä.
 */
async function runCouncilTurn({

  text,

  conversation,

  systemContext,

  runtimeContext,

  prisma,

}){

  const [
    spacemonkeyResult,
    altrakoResult,
  ] =
    await Promise.all([

      runAgentChat({

        message: text,

        conversation,

        systemContext,

        runtimeContext,

        prisma,

      }),

      runAltrakoTurn(text),

    ])



  const combinedAnswer =

    `🧠 Spacemonkey ehdottaa:\n${spacemonkeyResult.body.answer}\n\n` +
    `🐵 Altrako arvioi:\n${altrakoResult.body.answer}`



  return {

    status:
      spacemonkeyResult.status,

    body: {

      ...spacemonkeyResult.body,

      agent:
        "council",

      reason:
        "council mode",

      answer:
        combinedAnswer,

      altrako:
        altrakoResult.body.altrako,

    },

  }

}



/*
 * Varsinainen agent-chat-logiikka omana, uudelleenkäytettävänä
 * funktiona. Palauttaa vastauksen datana res.json:n sijaan, jotta
 * muutkin reitit (/api/ai-brain/chat, /api/ai-brain-v2/chat)
 * voivat kutsua tismalleen samaa polkua sen sijaan että ne
 * toteuttaisivat oman rinnakkaisen version samasta logiikasta -
 * "Yksi totuus", Constitution laki 5.
 */
async function runAgentChat({

  message,

  conversation = [],

  systemContext = null,

  runtimeContext = null,

  prisma,

}){


  if(

    typeof message !== "string"

    ||

    !message.trim()

  ){

    return {

      status: 400,

      body: {

        success:false,

        error:
          "Message puuttuu",

        ...createEmptyActionResponse(),

      },

    }

  }


  /*
  =====================================

  PERSONALITY TRIGGER

  =====================================
  */


  const personalityTrigger =

    checkTrigger(
      message
    )


  if(

    personalityTrigger.triggered

  ){

    return {

      status: 200,

      body: {

        success:true,


        agent:
          "personality",


        reason:
          "personality trigger",


        answer:
          personalityTrigger.response,

        ...createEmptyActionResponse(),

      },

    }

  }


  /*
  =====================================

  ACTION PLANNER

  =====================================
  */


  const actionPlan =

    planActions(
      message
    )


  if(

    actionPlan.matched &&

    actionPlan.complete &&

    actionPlan.actions.length > 1

  ){

    return {

      status: 200,

      body: {

        success:true,


        agent:
          "system",


        reason:
          "backend action plan",


        answer:
          createActionPlanAnswer(
            actionPlan.actions,
          ),


        ...createActionsResponse(
          actionPlan.actions,
        ),


        intentAnalysis:
          actionPlan.intentAnalysis,


        plannerDecision:
          actionPlan.plannerDecision,


        executionPlan:
          actionPlan.executionPlan,

      },

    }

  }





  const generatedAction =

    generateAIActions({

      message,

      runtimeContext,

    })





  if(

    generatedAction.matched &&

    generatedAction.actions.length > 0

  ){

    return {

      status: 200,

      body: {

        success:true,


        agent:
          "system",


        reason:
          generatedAction.reason,


        answer:
          generatedAction.answer,


        ...createActionsResponse(
          generatedAction.actions,
        ),

      },

    }

  }





  const requestedProjectName =

    getRequestedProjectName(
      message
    )





  if(requestedProjectName){

    const result =

      await findProjectByName(

        prisma,

        requestedProjectName,

      )


    if(result.project){

      return {

        status: 200,

        body: {

          success:true,


          agent:
            "system",


          reason:
            "project navigation command",


          answer:

            `Avataan projekti ${result.project.name}.`,


          ...createActionResponse({

            type:
              "navigate",


            path:

              `/projects/${result.project.id}`,


            label:
              result.project.name,

          }),

        },

      }

    }

  }





  const navigationCommand =

    findNavigationCommand(
      message
    )





  if(navigationCommand){

    return {

      status: 200,

      body: {

        success:true,


        agent:
          "system",


        reason:
          "workspace navigation command",


        answer:

          `Avataan ${navigationCommand.label}.`,


        ...createActionResponse({

          type:
            "navigate",


          path:
            navigationCommand.path,


          label:
            navigationCommand.label,

        }),

      },

    }

  }





  /*
  =====================================

  AGENT ROUTING

  =====================================
  */


  const agent =

    await buildAgentContext(
      message,
    )





  /*
  =====================================

  SPACEMONKEY IDENTITY PROTECTION

  Tämä vastaus ei mene Ollamalle.

  =====================================
  */


  if(

    agent.identityResponse

  ){

    return {

      status: 200,

      body: {

        success:true,


        agent:
          agent.agent,


        reason:
          agent.reason,


        answer:
          agent.identityResponse,


        ...createEmptyActionResponse(),


        debug:{

          identityProtected:true,

        },

      },

    }

  }





  const knowledge = [

    {

      name:
        "AGENT_CONTEXT",


      content:
        agent.context,

    },

  ]





  const systemRegistryKnowledge =

    createSystemContextKnowledge(
      systemContext,
    )





  if(systemRegistryKnowledge){

    knowledge.push(
      systemRegistryKnowledge,
    )

  }





  const runtimeContextKnowledge =

    await createRuntimeContextKnowledge(
      runtimeContext,
      prisma,
    )





  if(runtimeContextKnowledge){

    knowledge.push(
      runtimeContextKnowledge,
    )

  }





  if(agent.truth){

    knowledge.push({

      name:
        "TRUTH_CONTEXT",


      content:

        JSON.stringify(

          agent.truth,

          null,

          2,

        ),

    })

  }





  const safeConversation =

    Array.isArray(
      conversation,
    )

      ? conversation

      : []





  const result =

    await runAIBrain({

      message,

      knowledge,


      conversation:
        safeConversation,


      prisma,

    })





  return {

    status: 200,

    body: {

      success:true,


      agent:
        agent.agent,


      reason:
        agent.reason,


      answer:
        result.answer,


      ...createEmptyActionResponse(),


      debug:
        result.debug,

    },

  }

}







export default function createAgentChatRouter(
  prisma,
){

  const router =

    express.Router()




  router.post(

    "/chat",

    async(
      req,
      res,
    )=>{


      try {


        const {

          message,

          conversation = [],

          systemContext = null,

          runtimeContext = null,


        } = req.body


        const {
          mode,
          text,
        } =
          detectMode(message)


        let result

        if(mode === "altrako"){

          result =
            runAltrakoTurn(text)

        }
        else if(mode === "council"){

          result =
            await runCouncilTurn({

              text,

              conversation,

              systemContext,

              runtimeContext,

              prisma,

            })

        }
        else {

          result =
            await runAgentChat({

              message: text,

              conversation,

              systemContext,

              runtimeContext,

              prisma,

            })

        }


        const body = {

          ...result.body,

          mode,

          innerVoice:
            reflect(),

        }


        if(prisma){

          try {

            await appendChatTurn(
              prisma,
              {
                userText: text,
                mode,
                reply: body.answer,
              },
            )

          }
          catch(persistError){

            console.error(
              "CHAT HISTORY PERSIST ERROR:",
              persistError,
            )

          }

        }


        return res
          .status(result.status)
          .json(body)


      }

      catch(error){


        console.error(
          "AGENT CHAT ERROR:",
          error,
        )



        return res

          .status(500)

          .json({

            success:false,


            error:

              error.message ||

              "Tuntematon palvelinvirhe",


            ...createEmptyActionResponse(),

          })

      }


    },

  )



  router.get(

    "/history",

    async(
      req,
      res,
    )=>{

      try {

        const limit =
          Math.max(
            1,
            Math.min(
              Number(req.query.limit) || 50,
              200,
            ),
          )

        const history =
          prisma
            ? await loadChatHistory(prisma, limit)
            : []

        return res.json({
          success: true,
          history,
        })

      }
      catch(error){

        console.error(
          "CHAT HISTORY LOAD ERROR:",
          error,
        )

        return res
          .status(500)
          .json({
            success: false,
            error:
              error.message ||
              "Tuntematon palvelinvirhe",
            history: [],
          })

      }

    },

  )




  return router

}



export {
  runAgentChat,
}
