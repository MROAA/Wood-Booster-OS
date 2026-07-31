import express from "express"


import {
  createPublicSpacemonkeyContext,
} from "../services/spacemonkey/public/publicContext.js"


import {
  createPublicGuardResult,
} from "../services/spacemonkey/public/publicGuard.js"





export default function createSpacemonkeyRouter(
  prisma
){

  const router =
    express.Router()





  const allowedCommands = [

    "restart-core",

    "purge-logs",

    "emergency-stop",

  ]





  function validateCommand(
    command
  ){

    if(
      typeof command !== "string"
    ){

      return false

    }



    return allowedCommands.includes(
      command.trim()
    )

  }





  /*
  =====================================
  PUBLIC SPACEMONKEY API

  Wordpress / internet integraatio

  Ei yksityistä dataa

  =====================================
  */


  router.get(

    "/public",

    async(
      req,
      res
    )=>{


      const publicContext =
        createPublicSpacemonkeyContext()



      const result =
        createPublicGuardResult(
          publicContext
        )



      res.json({

        success:true,

        spacemonkey:
          result,

      })


    }

  )







  /*
  =====================================
  INTERNAL COMMAND API

  Säilytetään olemassa oleva rakenne

  =====================================
  */


  router.post(

    "/command",

    async(
      req,
      res
    )=>{


      const {
        command,
      } = req.body



      if(
        !validateCommand(
          command
        )
      ){

        return res
          .status(400)
          .json({

            success:false,

            error:
              "Spacemonkey command blocked"

          })

      }



      console.log(
        "🐵 Spacemonkey command:",
        command
      )



      return res.json({

        success:true,

        command,

        message:
          `🐵 Spacemonkey executed: ${command}`

      })


    }

  )







  /*
  =====================================
  STATUS

  =====================================
  */


  router.get(

    "/status",

    async(
      req,
      res
    )=>{


      res.json({

        success:true,

        operator:
          "Spacemonkey",


        status:
          "ONLINE",


        core:
          "READY",


        bananaPower:
          "90%",


        timestamp:
          new Date()
            .toISOString()

      })


    }

  )







  return router

}
