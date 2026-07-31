import {
  createSpacemonkeyContext,
} from "./spacemonkeyContextManager.js"


import {
  runSpacemonkeyReasoning,
} from "./spacemonkeyReasoningEngine.js"


import {
  runSpacemonkeyDecision,
} from "./spacemonkeyDecisionEngine.js"


import {
  runSpacemonkeyPlannerBridge,
} from "./spacemonkeyPlannerBridge.js"


import {
  buildSpacemonkeyPrompt,
} from "./spacemonkeyPromptBuilder.js"


import {
  convertPromptToText,
} from "./spacemonkeyPromptBuilder.js"


import {
  runSpacemonkeyLLM,
} from "./spacemonkeyLLMAdapter.js"


import {
  validateSpacemonkeyResponse,
} from "./spacemonkeyResponseValidator.js"


import {
  prepareMemoryRequest,
} from "./spacemonkeyMemoryInterface.js"


import {
  setSpacemonkeyState,

  SPACEMONKEY_STATES

} from "./spacemonkeyStateManager.js"


import {
  emit,

  SPACEMONKEY_EVENTS

} from "./spacemonkeyEventBus.js"



async function runSpacemonkeyPipeline({

  message,

  memory = [],

  knowledge = [],

  systemState = {},

}) {


  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.UNDERSTANDING,

    activity:
      "Creating context"

  })



  const context =
    createSpacemonkeyContext({

      message,

      memory,

      knowledge,

      systemState

    })



  emit({

    event:
      SPACEMONKEY_EVENTS.CONTEXT_CREATED,

    payload:
      context

  })



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.REASONING,

    activity:
      "Analyzing request"

  })



  const reasoning =
    runSpacemonkeyReasoning({

      message,

      context

    })



  const decision =
    runSpacemonkeyDecision({

      message,

      reasoning

    })



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.PLANNING,

    activity:
      "Creating plan"

  })



  const planning =
    runSpacemonkeyPlannerBridge({

      message,

      decision

    })



  const prompt =
    buildSpacemonkeyPrompt({

      context,

      reasoning,

      decision

    })



  const promptText =
    convertPromptToText({

      prompt

    })



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.EXECUTING,

    activity:
      "Requesting intelligence model"

  })



  const llmResponse =
    await runSpacemonkeyLLM({

      prompt:
        promptText

    })



  const validation =
    validateSpacemonkeyResponse({

      response:
        llmResponse.response.text

    })



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.REFLECTING,

    activity:
      "Evaluating response"

  })



  const memoryCandidate =
    prepareMemoryRequest({

      content:
        llmResponse.response.text,

      source:
        "spacemonkey"

    })



  setSpacemonkeyState({

    state:
      SPACEMONKEY_STATES.IDLE,

    activity:
      "Completed"

  })



  return {


    success:
      true,


    agent:
      "spacemonkey",


    response:
      llmResponse.response.text,


    pipeline:


    {

      context,

      reasoning,

      decision,

      planning,

      validation,

      memoryCandidate

    },


    completedAt:
      new Date().toISOString()

  }


}



export {

  runSpacemonkeyPipeline

}
