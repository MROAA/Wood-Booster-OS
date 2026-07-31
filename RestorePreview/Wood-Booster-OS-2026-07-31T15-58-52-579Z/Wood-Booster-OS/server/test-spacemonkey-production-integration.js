import express from "express"


import {

  runSpacemonkeyServerIntegration

} from "./services/spacemonkey/spacemonkeyServerIntegrationRunner.js"





const app = express()





app.use(
  express.json()
)





const result =

  runSpacemonkeyServerIntegration({

    app

  })





app.get(
  "/test",

  (req,res)=>{

    res.json({

      ok:true

    })

  }

)





const server =

  app.listen(

    3999,

    async ()=>{


      console.log(

        JSON.stringify(

          result,

          null,

          2

        )

      )


      console.log(

        "TEST SERVER http://localhost:3999"

      )


    }

  )
