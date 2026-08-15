import express from "express"


import {
  getCreatorDecisions,
  findDecision,
  getDecisionsByCategory,
} from "../services/spacemonkey/modules/creatorDecisions/index.js"





function createSpacemonkeyCreatorDecisionsRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/decisions",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "creator-decisions", decisions: getDecisionsByCategory(category) }
            : getCreatorDecisions()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator decisions error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/decisions/:id",

    (req, res)=>{

      try{

        const item =
          findDecision(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, decision:item })

      }
      catch(error){

        console.error("Spacemonkey creator decisions lookup error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorDecisionsRouter

}
