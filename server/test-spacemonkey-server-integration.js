import express from "express"


import {

  initializeSpacemonkey

} from "./services/spacemonkey/spacemonkeyServerIntegration.js"







const app = express()







console.log(

  JSON.stringify(

    initializeSpacemonkey({

      app

    }),

    null,

    2

  )

)
