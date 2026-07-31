import express from "express"

import {
  runSpacemonkeyServerIntegration
} from "./services/spacemonkey/spacemonkeyServerIntegrationRunner.js"


const app = express()


const result =
  runSpacemonkeyServerIntegration({
    app
  })


console.log(
  "MOUNT RESULT"
)

console.log(
  JSON.stringify(
    result,
    null,
    2
  )
)



console.log(
  "\nEXPRESS STACK"
)


for (
  const layer
  of app._router?.stack || []
){

  console.log(
    layer.route?.path ||
    layer.regexp?.toString()
  )

}



app.listen(
  4001,
  ()=>{

    console.log(
      "DEBUG SERVER http://localhost:4001"
    )

  }
)
