import express from "express"



import {

  startSpacemonkey

} from "./services/spacemonkey/spacemonkeyStart.js"







const app = express()







console.log(

  JSON.stringify(

    startSpacemonkey({

      app

    }),

    null,

    2

  )

)
