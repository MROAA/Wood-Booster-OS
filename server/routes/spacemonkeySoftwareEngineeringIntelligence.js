import express from "express"


import {
  getEngineeringKnowledge,
  findEngineeringPrinciple,
  getKnowledgeByCategory,
} from "../services/spacemonkey/modules/softwareEngineeringIntelligence/index.js"





function createSpacemonkeySoftwareEngineeringIntelligenceRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/engineering-knowledge",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "software-engineering-intelligence", knowledge: getKnowledgeByCategory(category) }
            : getEngineeringKnowledge()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey software engineering intelligence error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/engineering-knowledge/:id",

    (req, res)=>{

      try{

        const item =
          findEngineeringPrinciple(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, principle:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySoftwareEngineeringIntelligenceRouter

}
