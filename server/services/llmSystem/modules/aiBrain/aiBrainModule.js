import {
  createModuleDefinition
} from "../moduleInterface.js"



import {
  executeAIRequest,
  health as adapterHealth
} from "./aiBrainV2Adapter.js"





let connected = false







async function initialize(){


  const status =
    await adapterHealth()



  connected =
    status.status === "READY"


}







async function health(){


  const status =
    await adapterHealth()



  return {

    status:
      connected
        ? "READY"
        : "OFFLINE",

    module:
      "aiBrain",

    adapter:
      status

  }


}







async function execute({

  action,

  payload = {}

}) {


  switch(action){


    case "chat":


      return await executeAIRequest({

        message:
          payload.message,

        source:
          "llmSystem",

        runtimeContext:
          payload.context || {}

      })




    case "status":


      return {

        success:true,

        status:
          await health()

      }




    default:


      return {

        success:true,

        message:
          "AI Brain V2 adapter active",

        action,

        payload

      }


  }


}







const aiBrainModule =

  createModuleDefinition({

    id:
      "aiBrain",

    name:
      "AI Brain V2 Adapter",

    version:
      "1.1.0",

    description:
      "Secure adapter between LLM System and Wood-Booster AI Brain V2.",


    capabilities:[

      "reasoning",

      "agent_routing",

      "knowledge_processing",

      "truth_validation",

      "llm_execution"

    ],


    permissions:[

      "read_context",

      "execute_ai_brain_requests"

    ],


    initialize,

    health,

    execute

  })







export default aiBrainModule
