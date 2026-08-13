import {
  collectContextFromProviders
} from "./contextProviders.js"





async function createBaseContext({

  message,

  source = "unknown",

  runtimeContext = {}

}) {


  const providerContext =
    await collectContextFromProviders({

      request: {

        message,

        source

      }

    })





  return {

    createdAt:
      new Date()
        .toISOString(),


    request: {

      message,

      source

    },


    ...providerContext,


    runtime:
      runtimeContext

  }


}







function extendContext(

  context,

  extension = {}

){


  return {

    ...context,

    ...extension

  }


}







function getContextSummary(context){


  return {

    request:
      context.request,


    systemStatus:
      context.system?.status || "UNKNOWN",


    modules:
      context.system?.modules
        ?.map(
          module =>
            module.id
        ) || [],


    identity:
      context.identity?.name || "UNKNOWN",


    providers:
      Object.keys(context)
        .filter(
          key =>
            ![
              "createdAt",
              "request",
              "runtime"
            ]
            .includes(key)
        )

  }


}







export {

  createBaseContext,

  extendContext,

  getContextSummary

}
