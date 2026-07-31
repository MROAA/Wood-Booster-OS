import express from "express"


import {

  initializeSpacemonkeyServer

} from "./services/spacemonkey/spacemonkeyServerIntegrationAdapter.js"







const app = express()







console.log(

  JSON.stringify(

    initializeSpacemonkeyServer({

      app

    }),

    null,

    2

  )

)
