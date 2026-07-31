import {
  createBaseContext
} from "./contextEngine.js"







async function createAIContext({

  message,

  source = "llmSystem",

  runtimeContext = {}

} = {}) {


  const context =
    await createBaseContext({

      message,

      source,

      runtimeContext

    })



  return {

    message,

    context

  }


}







function attachContextToRequest({

  request = {},

  context

}) {


  return {

    ...request,


    context

  }


}







export {

  createAIContext,

  attachContextToRequest

}
