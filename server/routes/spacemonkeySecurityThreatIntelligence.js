import express from "express"


import {
  getThreatIntelligence,
  findThreat,
  getCriticalThreats,
  getThreatsByCategory,
} from "../services/spacemonkey/modules/securityThreatIntelligence/index.js"





function createSpacemonkeySecurityThreatIntelligenceRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/threats",

    (req, res)=>{

      try{

        const { category, critical } =
          req.query


        if(critical === "true"){

          return res.json({ success:true, moduleId:"security-threat-intelligence", threats:getCriticalThreats() })

        }


        const data =
          category
            ? { moduleId: "security-threat-intelligence", threats: getThreatsByCategory(category) }
            : getThreatIntelligence()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey security threats error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/security/threats/:id",

    (req, res)=>{

      try{

        const item =
          findThreat(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, threat:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecurityThreatIntelligenceRouter

}
