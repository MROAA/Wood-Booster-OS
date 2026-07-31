import {
  buildRuntimeContext,
} from "./services/aiBrainV2/runtime/runtimeContextBuilder.js"



const context =
  await buildRuntimeContext()



console.log(context)
