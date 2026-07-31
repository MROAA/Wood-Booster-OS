import express from "express"

import {
  createSpacemonkeyOSRouter
} from "./routes/spacemonkeyOS.js"


const app = express()


const router =
  createSpacemonkeyOSRouter()


app.use(
  "/api/spacemonkey/os",
  router
)


app.listen(
  4000,
  ()=>{

    console.log(
      "DIRECT TEST http://localhost:4000"
    )

  }
)
