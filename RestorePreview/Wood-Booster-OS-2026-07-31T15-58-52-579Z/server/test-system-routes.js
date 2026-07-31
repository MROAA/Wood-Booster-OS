import express from "express"

import {
  runServerStartup,
} from "./services/serverStartup.js"



const app =
  express()



app.use(
  express.json()
)



runServerStartup(
  app
)



app.listen(
  3998,
  ()=>{

    console.log(
      "SYSTEM ROUTES TEST SERVER RUNNING"
    )

  }
)
