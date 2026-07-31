import express from "express"



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



  function validateCommand(command){

    if(
      typeof command !== "string"
    ){

      return false

    }


    return allowedCommands.includes(
      command.trim()
    )

  }




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
        !validateCommand(command)
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
          new Date().toISOString()

      })


    }
  )





  return router

}
