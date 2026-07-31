import express from "express"


import {

  bootSpacemonkeyServer

} from "./services/spacemonkey/spacemonkeyServerBootstrap.js"







const app = express()







console.log(

  JSON.stringify(

    bootSpacemonkeyServer({

      app

    }),

    null,

    2

  )

)
