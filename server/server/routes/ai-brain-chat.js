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





export default function createAIBrainChatRouter(
  prisma,
) {


  const router =
    express.Router()






  /*
  ==================================================

  AI BRAIN CHAT

  POST /api/ai-brain/chat

  ==================================================
  */



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

            success:
              false,

            error:
              "Viestin sisältö puuttuu."

          })


        }








        let conversationId =
          req.body.conversationId ||
          null







        /*
        =============================================
        LUO KESKUSTELU
        =============================================
        */



        if (!conversationId) {


          const conversation =

            await prisma.conversation.create({

              data: {

                title:
                  createTitle(
                    message,
                  ),

              },

            })



          conversationId =
            conversation.id


        }









        /*
        =============================================
        HAE HISTORIA
        =============================================
        */



        const previousMessages =

          await prisma.message.findMany({

            where: {

              conversationId,

            },


            orderBy: {

              createdAt:
                "asc",

            },


            take:
              20,

          })





        const conversation =

          previousMessages.map(

            message => ({

              role:
                message.role,


              content:
                message.content,

            })

          )









        /*
        =============================================
        TALLENNA KÄYTTÄJÄN VIESTI
        =============================================
        */



        await prisma.message.create({

          data: {


            role:
              "user",


            content:
              message,


            conversationId,


          },


        })









        /*
        =============================================
        KNOWLEDGE SEARCH
        =============================================
        */



        let knowledge = []



        try {


          knowledge =

            await searchKnowledge(
              message,
            )


        }


        catch(error) {


          console.error(

            "Knowledge search failed:",

            error.message,

          )


        }









        /*
        =============================================
        AI BRAIN CORE
        =============================================
        */



        const result =

          await runAIBrain({

            message,


            knowledge,


            conversation,


            model:

              req.body.model ||

              DEFAULT_MODEL,


            prisma,


          })








        if (!result.success) {


          throw new Error(

            result.error ||

            "AI Brain epäonnistui.",

          )


        }







        const answer =

          String(

            result.answer || "",

          ).trim()









        /*
        =============================================
        TALLENNA AI VASTAUS
        =============================================
        */



        await prisma.message.create({

          data: {


            role:
              "assistant",


            content:
              answer,


            conversationId,


          },


        })








        /*
        =============================================
        RESPONSE
        =============================================
        */



        return res.json({


          success:
            true,


          conversationId,


          answer,



          model:

            result.model ||


            DEFAULT_MODEL,



          memoryProposalCreated:

            result.memoryProposalCreated ||


            false,



          memoryProposal:

            result.memoryProposal ||


            null,



          debug:

            result.debug ||


            null,



        })









      }

      catch(error) {


        console.error(

          "AI Brain Chat Error:",

          error,

        )



        return res.status(500).json({

          success:
            false,


          error:

            error.message ||

            "AI Brain virhe.",


        })


      }



    },

  )








  return router


}








function createTitle(
  text,
) {


  const clean =

    text
      .replace(/\s+/g, " ")
      .trim()





  if (
    clean.length <= 60
  ) {

    return clean

  }



  return (

    clean.slice(0,57)

    +

    "..."

  )


}