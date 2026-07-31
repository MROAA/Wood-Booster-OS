import express from "express"


import {

  runSpacemonkeyServerIntegration

} from "./services/spacemonkey/spacemonkeyServerIntegrationRunner.js"





const app = express()





console.log(

  JSON.stringify(

    runSpacemonkeyServerIntegration({

      app

    }),

    null,

    2

  )

)
