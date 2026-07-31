import express from "express"

import {
  runSpacemonkeyRouteBootstrap,
} from "./services/spacemonkeyRouteBootstrap.js"



const app =
  express()



runSpacemonkeyRouteBootstrap(
  app
)



app.listen(
  3997,
  ()=>{
    console.log(
      "SPACEMONKEY ROUTE BOOTSTRAP TEST SERVER RUNNING"
    )
  }
)
