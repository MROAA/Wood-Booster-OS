import express from "express"

import {
  createSpacemonkeySystemRouter,
} from "./routes/spacemonkeySystem.js"



const app =
  express()



const router =
  createSpacemonkeySystemRouter()



app.use(
  "/api",
  router
)



console.log(
  "Router loaded:",
  router.stack.map(
    layer =>
      layer.route?.path
  )
)



app.listen(
  3996,
  ()=>{
    console.log(
      "ROUTE TEST SERVER RUNNING"
    )
  }
)
