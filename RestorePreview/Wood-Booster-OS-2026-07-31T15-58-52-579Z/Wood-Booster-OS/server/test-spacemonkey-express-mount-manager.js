import express from "express"


import {

  mountSpacemonkeyExpressRoutes

} from "./services/spacemonkey/spacemonkeyExpressMountManager.js"





const app = express()





console.log(

  JSON.stringify(

    mountSpacemonkeyExpressRoutes({

      app

    }),

    null,

    2

  )

)
