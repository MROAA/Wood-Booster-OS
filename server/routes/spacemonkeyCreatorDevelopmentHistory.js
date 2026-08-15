import express from "express"


import {
  getDevelopmentHistory,
  findHistoryEntry,
  getHistoryByPhase,
} from "../services/spacemonkey/modules/creatorDevelopmentHistory/index.js"





function createSpacemonkeyCreatorDevelopmentHistoryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/development-history",

    (req, res)=>{

      try{

        const phase =
          req.query.phase


        const data =
          phase
            ? { moduleId: "creator-development-history", history: getHistoryByPhase(phase) }
            : getDevelopmentHistory()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator development history error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/development-history/:id",

    (req, res)=>{

      try{

        const item =
          findHistoryEntry(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, entry:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorDevelopmentHistoryRouter

}
