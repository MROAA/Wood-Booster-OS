import express from "express"


import {

  mountSpacemonkeyRouter

} from "./services/spacemonkey/spacemonkeyExpressMountAdapter.js"



const app = express()



const router = express.Router()



router.get(

  "/test",

  (

    req,

    res

  )=>{


    res.json({

      success:true

    })


  }

)





console.log(

  JSON.stringify(

    mountSpacemonkeyRouter({

      app,

      path:"/api/spacemonkey",

      router

    }),

    null,

    2

  )

)
