import { runAIBrain } from "./services/aiBrain.js"


const result =
  await runAIBrain({

    message:
      "Mikä on Wood-Boosterin filosofia?"

  })


console.log(result)