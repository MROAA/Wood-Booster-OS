import {
  runBrain,
} from "./services/aiBrainV2/index.js"



console.log(
  "=== CONSTITUTION PIPELINE TEST ==="
)



const result =
  await runBrain({

    message:
      "Avaa projektit",

  })



console.dir(
  result,
  {
    depth:
      null,
  },
)
