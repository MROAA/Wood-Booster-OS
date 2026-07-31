import express from "express"


import {
  getSpacemonkeyCoreStatus,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyCoreStatusService.js"


import {
  getActivityHistory,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyActivityService.js"





export default function createSpacemonkeyBrainStateRouter(){


  const router =
    express.Router()



  router.get(
    "/spacemonkey/state",

    async (
      req,
      res
    ) => {


      try {


        const prisma =
          req.app.locals.prisma





        const core =
          await getSpacemonkeyCoreStatus({
            prisma
          })





        const activity =
          await getActivityHistory({
            prisma
          })







        const knowledgeDocuments =
          await prisma.knowledgeDocument.findMany({

            select:{

              folder:true

            }

          })





        const knowledge = {


          status:
            "READY",


          sources:
            knowledgeDocuments.length,


          domains:

            [

              ...new Set(

                knowledgeDocuments
                  .map(
                    item =>
                      item.folder
                  )
                  .filter(Boolean)

              )

            ]

        }







        res.json({

          success:true,


          data:{

            identity:
              core.identity,


            persona:
              core.persona,


            knowledge,


memory:
{
  ...core.memory,

  persistent:true
},

            worldModel:
              core.worldModel,


            cognitive:
              core.cognitive,


            decision:
              core.decision,


            activity,


            safety:
              core.safety

          }

        })


      }


      catch(error){


        console.error(
          "Spacemonkey Brain State error:",
          error
        )


        res.status(500).json({

          success:false,

          error:
            error.message

        })


      }


    }

  )


  return router

}
