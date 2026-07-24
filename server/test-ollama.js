import {
  generateWithOllama
} from "./services/ollamaClient.js"



const result =
  await generateWithOllama({

    prompt:
      "Kerro lyhyesti mitä Wood-Booster AI Brain tekee."

  })


console.log(result)