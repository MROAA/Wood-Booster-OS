import {
  buildLLMContext
} from "./contextBuilder.js"



import {
  runResponsePipeline,
  createDefaultPipeline
} from "./responsePipeline.js"





function createRequestContext({

  message,

  system = "",

  identity = "",

  security = "",

  memory = "",

  knowledge = "",

  task = ""

}) {


  return {

    message,

    system,

    identity,

    security,

    memory,

    knowledge,

    task

  }


}







async function executeLLM({

  context,

  llmProvider

}) {


  if(
    typeof llmProvider !== "function"
  ){

    throw new Error(
      "LLM provider missing"
    )

  }



  const prompt =
    buildLLMContext({

      system:
        context.system,

      identity:
        context.identity,

      security:
        context.security,

      memory:
        context.memory,

      knowledge:
        context.knowledge,

      task:
        context.task,

      userMessage:
        context.message

    })



  const response =
    await llmProvider({
      prompt
    })



  return response

}







async function runLLMOrchestrator({

  message,

  llmProvider,

  context = {},

  pipelineSteps = null

}) {


  const requestContext =
    createRequestContext({

      message,

      ...context

    })





  const llmResponse =
    await executeLLM({

      context:
        requestContext,

      llmProvider

    })





  const pipeline =
    pipelineSteps ||
    createDefaultPipeline()





  const finalResponse =
    await runResponsePipeline({

      response:
        llmResponse,

      steps:
        pipeline

    })





  return {

    success:
      finalResponse.success,

    response:
      finalResponse.response,

    metadata:
      finalResponse.metadata || {},

    context:

      {

        characters:
          buildLLMContext(requestContext).length

      }

  }


}







export {

  createRequestContext,

  executeLLM,

  runLLMOrchestrator

}
