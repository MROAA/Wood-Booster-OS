import {
  createFinnishRuntimeContext,
} from "./services/aiBrainV2/engines/finnishRuntimeContext.js"



const context =
  await createFinnishRuntimeContext()



console.log(
  context,
)
