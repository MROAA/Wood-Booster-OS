import { buildAIContext } from "./services/contextBuilder.js"


const context =
  await buildAIContext({

    message:
      "Mikä on Wood-Boosterin filosofia?",

    knowledge: [],

    memory: [],

    conversation: []

  })


console.log(
  context.substring(0,4000)
)