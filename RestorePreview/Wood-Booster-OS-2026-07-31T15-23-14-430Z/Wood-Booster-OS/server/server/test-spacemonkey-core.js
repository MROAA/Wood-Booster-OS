import {
  getSpacemonkeyCore,
} from "./services/aiBrainV2/personality/spacemonkeyLoader.js"


import {
  runSpacemonkeyHealthCheck,
} from "./services/aiBrainV2/personality/spacemonkeyHealthMonitor.js"


import {
  runSpacemonkey,
} from "./services/aiBrainV2/personality/spacemonkeyOrchestrator.js"



console.log(
  "\n=============================="
)

console.log(
  " SPACEMONKEY CORE TEST"
)

console.log(
  "==============================\n"
)



console.log(
  "1. Loading Spacemonkey Core..."
)


const core =
  getSpacemonkeyCore()



console.log({

  name:
    core.name,

  version:
    core.version,

  status:
    core.status

})



console.log(
  "\n2. Running Health Check..."
)


const health =
  runSpacemonkeyHealthCheck()



console.log(
  health
)



console.log(
  "\n3. Running Cognitive Pipeline..."
)



const result =
  await runSpacemonkey({

    message:
      "Suunnitellaan uusi AI Brain muistijärjestelmä",

    systemContext:

    {

      project:
        "Wood-Booster OS",

      environment:
        "development"

    },

    memory:
      [],

    knowledge:
      []

  })



console.log(
  "\n4. Pipeline Result:"
)


console.dir(
  result,
  {
    depth: null
  }
)



console.log(
  "\n=============================="
)

console.log(
  " SPACEMONKEY TEST COMPLETE"
)

console.log(
  "==============================\n"
)
