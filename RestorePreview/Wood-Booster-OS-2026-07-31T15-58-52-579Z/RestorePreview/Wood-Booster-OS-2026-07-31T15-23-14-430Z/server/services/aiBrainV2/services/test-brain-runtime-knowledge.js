import {
  runBrainRuntime
} from "../brainRuntime.js"



const result =
  await runBrainRuntime({

    message:
      "Mikä on Spacemonkeyn persoonallisuus?",


    source:
      "knowledge-test"

  })



console.log(
  "BRAIN RUNTIME KNOWLEDGE TEST"
)



console.dir(
  {

    success:
      result.success,


    status:
      result.status,


    metadata:
      result.metadata

  },

  {
    depth:null
  }
)
