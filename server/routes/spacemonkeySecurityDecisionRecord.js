import express from "express"


import {
  createDecisionRecord,
  updateDecisionOutcome,
  getDecisionHistory,
  getCriticalDecisions,
} from "../services/spacemonkey/modules/securityDecisionRecord/index.js"





function createSpacemonkeySecurityDecisionRecordRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/decisions",

    (req, res)=>{

      try{

        const critical =
          req.query.critical === "true"


        const data =
          critical
            ? { moduleId: "security-decision-record", decisions: getCriticalDecisions() }
            : getDecisionHistory()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey security decisions error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/security/decisions",

    (req, res)=>{

      try{

        const record =
          createDecisionRecord(req.body || {})


        res.json({ success:true, record })

      }
      catch(error){

        console.error("Spacemonkey security decisions create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/security/decisions/outcome",

    (req, res)=>{

      try{

        const record =
          updateDecisionOutcome(req.body || {})


        if(!record){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, record })

      }
      catch(error){

        console.error("Spacemonkey security decisions outcome error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecurityDecisionRecordRouter

}
