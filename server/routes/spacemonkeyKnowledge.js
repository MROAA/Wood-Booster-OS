/*
=====================================

SPACEMONKEY KNOWLEDGE ROUTER

Tarjoaa Knowledge Intelligence
datan frontendille.

Ei sisällä tietologiikkaa.

=====================================
*/


import express from "express"


import {

  createKnowledgeReport,
  getKnowledgeState

} from "../services/spacemonkey/modules/knowledgeIntelligence/index.js"







function createSpacemonkeyKnowledgeRouter(){


  const router =

    express.Router()







  router.get(

    "/spacemonkey/knowledge",

    (

      req,

      res

    )=>{


      try{


        const knowledge =

          createKnowledgeReport()



        const state =

          getKnowledgeState()





        res.json({

          success:true,

          knowledge,

          state,

        })


      }


      catch(error){


        console.error(

          "Spacemonkey knowledge error:",

          error

        )



        res.status(500).json({

          success:false,

          error:error.message

        })


      }


    }

  )







  return router


}







export {

  createSpacemonkeyKnowledgeRouter

}
