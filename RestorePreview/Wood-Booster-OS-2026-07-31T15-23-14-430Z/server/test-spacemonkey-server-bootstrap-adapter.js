import express from "express"


import {

  startSpacemonkeyServer

} from "./services/spacemonkey/spacemonkeyServerBootstrapAdapter.js"







const app = express()







console.log(

  JSON.stringify(

    startSpacemonkeyServer({

      app

    }),

    null,

    2

  )

)
