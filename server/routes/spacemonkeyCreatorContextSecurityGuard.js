import express from "express"


import {
  requestAccess,
  validateRequester,
  getSecurityRules,
  getAccessLog,
} from "../services/spacemonkey/modules/creatorContextSecurityGuard/index.js"





function createSpacemonkeyCreatorContextSecurityGuardRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/context/security/rules",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSecurityRules() })

      }
      catch(error){

        console.error("Spacemonkey creator context security rules error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/security/access-log",

    (req, res)=>{

      try{

        res.json({ success:true, ...getAccessLog() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/security/request-access",

    (req, res)=>{

      try{

        res.json({ success:true, ...requestAccess(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator context security request access error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/security/validate-requester",

    (req, res)=>{

      try{

        const requester =
          req.body?.requester


        res.json({ success:true, ...validateRequester(requester) })

      }
      catch(error){

        console.error("Spacemonkey creator context security validate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorContextSecurityGuardRouter

}
