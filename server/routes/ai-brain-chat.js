import express from "express"


import {
  runAIBrain,
} from "../services/aiBrain.js"


import {
  saveMemoryProposal,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyMemoryBridge.js"


import {
  findMemory,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyPersistentMemory.js"


import {
  retrieveRelevantMemories,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyMemoryRetrieval.js"


import {
  searchKnowledge,
} from "../services/knowledgeSearch.js"


import {
  detectIntent,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyIntentEngine.js"


import {
  process as processSpacemonkey,
} from "../services/aiBrainV2/system/spacemonkey/spacemonkeyBrainFacade.js"




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





        const conversationId =
          req.body.conversationId





        let conversationHistory = []





        if(conversationId){


          conversationHistory =

            await prisma.message.findMany({

              where:{

                conversationId,

              },


              orderBy:{

                createdAt:
                  "asc"

              },


              take:
                MAX_HISTORY_MESSAGES

            })


        }





        let knowledge = []



        try {


          knowledge =
            await searchKnowledge({

              query:
                message,

              prisma,

            })


        }

        catch(error){


          console.error(
            "Knowledge search error:",
            error.message
          )


        }






        let memoryContext = []



        try {


          const allMemories =

            await findMemory({

              prisma

            })



          const recalledMemories =

            retrieveRelevantMemories({

              query:

                message,


              memories:

                allMemories

            })



          memoryContext =

            recalledMemories.memories || []



        }

        catch(error){


          console.error(

            "Memory retrieval error:",

            error.message

          )


        }







        try {


          await processSpacemonkey({

            message,

            prisma,

          })


        }


        catch(error){


          console.error(

            "Spacemonkey observer error:",

            error.message

          )


        }
        const intent =

          detectIntent({

            message,

          })







        if (

          intent.intent ===

          "CODING_REQUEST"

        ) {


          const spacemonkeyResult =

            await processSpacemonkey({

              message,

              prisma,

            })



          const answer =

            String(

              spacemonkeyResult
                ?.response
                ?.response ||

              "Spacemonkey ei palauttanut vastausta."

            ).trim()





          let spacemonkeyMemoryResult = null





          if(

            spacemonkeyResult.memoryProposalCreated &&

            spacemonkeyResult.memoryProposal

          ){


            spacemonkeyMemoryResult =

              await saveMemoryProposal({

                prisma,

                proposal:

                  spacemonkeyResult.memoryProposal

              })

          }





          return res.json({

            success:true,


            conversationId,


            model:
              "Spacemonkey",


            answer,


            spacemonkey:true,


            memorySaved:

              spacemonkeyMemoryResult?.saved ||

              false,


            spacemonkeyMemory:

              spacemonkeyMemoryResult ||

              null,


          })


        }









        const brainResult =

          await runAIBrain({

            message,


            knowledge,


            conversation:
              conversationHistory,


            model:
              DEFAULT_MODEL,


            prisma,


            memoryContext,

          })





        const answer =

          String(

            brainResult.answer ||

            "Ei vastausta."

          ).trim()





        let spacemonkeyMemoryResult = null





        if(

          brainResult.memoryProposalCreated &&

          brainResult.memoryProposal

        ){


          spacemonkeyMemoryResult =

            await saveMemoryProposal({

              prisma,

              proposal:

                brainResult.memoryProposal

            })

        }







        return res.json({

          success:true,


          conversationId,


          model:
            DEFAULT_MODEL,


          memorySaved:

            spacemonkeyMemoryResult?.saved ||

            false,


          spacemonkeyMemory:

            spacemonkeyMemoryResult ||

            null,


          answer,


          memoryProposalCreated:

            brainResult.memoryProposalCreated ||

            false,


          memoryProposal:

            brainResult.memoryProposal ||

            null,


          knowledgeSources:

            brainResult.knowledgeSources ||

            [],


          memoryContext,


          debug:

            brainResult.debug || {},


        })



      }


      catch(error){


        console.error(

          "AI Brain Chat Error:",

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
