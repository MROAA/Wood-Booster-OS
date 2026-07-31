import prisma from "./prisma.js"


import {
  runCodePipeline,
} from "./services/aiBrainV2/system/spacemonkey/spacemonkeyCodePipeline.js"


import {
  getRecentActivities,
} from "./services/aiBrainV2/system/spacemonkey/spacemonkeyActivityFeedEngine.js"



const result =

  await runCodePipeline({

    prisma,


    codingContext: {

      filePath:
        "src/components/ai/ChatPanel.jsx",

      target:
        "ChatPanel"

    },


    codeChangePlan: {

      action:
        "update",

      steps:

      [

        "test"

      ]

    },


    sourceCode:

      "function ChatPanel(){}",


    instruction:

      "Testaa Spacemonkey activity storage"

  })



console.log(

  "PIPELINE RESULT"

)


console.log(

  result

)



const activities =

  await getRecentActivities({

    prisma

  })



console.log(

  "ACTIVITIES"

)


console.log(

  activities

)



await prisma.$disconnect()
