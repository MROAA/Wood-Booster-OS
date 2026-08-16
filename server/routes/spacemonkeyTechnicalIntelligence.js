import express from "express"


import {
  getTechnicalKnowledgeMap,
  findTechnicalDomain,
  getDomainsByCategory,
} from "../services/spacemonkey/modules/technicalIntelligence/index.js"





function createSpacemonkeyTechnicalIntelligenceRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/technical-knowledge",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "technical-intelligence", domains: getDomainsByCategory(category) }
            : getTechnicalKnowledgeMap()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey technical intelligence error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/technical-knowledge/:id",

    (req, res)=>{

      try{

        const item =
          findTechnicalDomain(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, domain:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyTechnicalIntelligenceRouter

}
