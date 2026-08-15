import express from "express"


import {
  getAIEngineeringCapability,
  findAICapability,
  getCapabilitiesByCategory,
} from "../services/spacemonkey/modules/aiEngineeringCapability/index.js"





function createSpacemonkeyAiEngineeringCapabilityRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/capabilities/ai-engineering",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "ai-engineering-capability", capabilities: getCapabilitiesByCategory(category) }
            : getAIEngineeringCapability()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey ai engineering capability error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/capabilities/ai-engineering/:id",

    (req, res)=>{

      try{

        const item =
          findAICapability(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, capability:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyAiEngineeringCapabilityRouter

}
