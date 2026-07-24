import express from "express"

import {
  runAIBrain,
} from "../services/aiBrain.js"


import {
  searchKnowledge,
} from "../services/knowledgeSearch.js"



const DEFAULT_MODEL =
  process.env.OLLAMA_MODEL ||
  "qwen2.5:7b"



const MAX_HISTORY_MESSAGES = 20






export default function createAIBrainChatRouter(prisma) {


  const router =
    express.Router()






  router.post(
    "/chat",
    async (req, res) => {


      try {


        const message =
          String(
            req.body.message || "",
          ).trim()





        if (!message) {


          return res.status(400).json({

            success:false,

            error:
              "Viestin sisältö puuttuu.",

          })


        }






        const requestedModel =
          String(

            req.body.model ||

            DEFAULT_MODEL

          ).trim()







        let conversationId =
          req.body.conversationId
            ? String(
                req.body.conversationId,
              )
            : null







        /*
        =================================
        CREATE / LOAD CONVERSATION
        =================================
        */


        if (conversationId) {


          const existingConversation =
            await prisma.conversation.findUnique({

              where:{
                id:conversationId,
              },

            })



          if (!existingConversation) {


            return res.status(404).json({

              success:false,

              error:
                "Keskustelua ei löytynyt.",

            })


          }


        }


        else {


          const conversation =
            await prisma.conversation.create({

              data:{

                title:
                  createConversationTitle(
                    message,
                  ),

              },

            })



          conversationId =
            conversation.id


        }









        /*
        =================================
        LOAD HISTORY
        =================================
        */


        const storedHistory =

          await prisma.message.findMany({

            where:{

              conversationId,

            },


            orderBy:{

              createdAt:
                "desc",

            },


            take:
              MAX_HISTORY_MESSAGES,


          })




        const conversationHistory =

          storedHistory

            .reverse()

            .map(
              item => ({

                role:
                  item.role,


                content:
                  item.content,


              })
            )










        /*
        =================================
        SAVE USER MESSAGE
        =================================
        */


        await prisma.message.create({

          data:{


            role:
              "user",


            content:
              message,


            conversationId,


          },


        })









        /*
        =================================
        SEARCH KNOWLEDGE
        =================================
        */


        let knowledge = []



        try {


          knowledge =

            await searchKnowledge(

              message

            )



        }


        catch(error) {


          console.error(

            "KNOWLEDGE SEARCH ERROR:",

            error.message

          )


          knowledge = []


        }









        /*
        =================================
        RUN AI BRAIN

        HUOM:
        prisma välitetään tänne
        =================================
        */


        const brainResult =

          await runAIBrain({

            message,


            knowledge,


            conversation:
              conversationHistory,


            model:
              requestedModel,


            prisma,


          })








        if (!brainResult.success) {


          throw new Error(

            brainResult.error ||

            "AI Brain epäonnistui."

          )


        }








        const answer =

          String(

            brainResult.answer ||

            ""

          ).trim()







        if (!answer) {


          throw new Error(

            "AI palautti tyhjän vastauksen."

          )


        }









        /*
        =================================
        SAVE AI RESPONSE
        =================================
        */


        await prisma.message.create({

          data:{


            role:
              "assistant",


            content:
              answer,


            conversationId,


          },


        })








        await prisma.conversation.update({

          where:{

            id:
              conversationId,

          },


          data:{


            updatedAt:
              new Date(),


          },


        })









        /*
        =================================
        RESPONSE
        =================================
        */


        return res.json({


          success:true,


          conversationId,


          model:

            brainResult.model ||

            requestedModel,



          answer,



          memoryProposalCreated:

            brainResult.memoryProposalCreated ||

            false,



          memoryProposal:

            brainResult.memoryProposal ||

            null,



          knowledgeSources:

            brainResult.knowledgeSources || [],



          debug:

            brainResult.debug || null,


        })






      }


      catch(error) {


        console.error(

          "AI BRAIN CHAT ERROR:",

          error

        )



        return res.status(500).json({

          success:false,


          error:

            error.message ||

            "AI Brain epäonnistui.",


        })


      }


    }

  )





  return router

}









function createConversationTitle(message) {


  const normalized =

    message

      .replace(/\s+/g," ")

      .trim()



  if (

    normalized.length <= 60

  ) {


    return normalized


  }



  return (

    normalized.slice(
      0,
      57
    )

    + "..."

  )


}