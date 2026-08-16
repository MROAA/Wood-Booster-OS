import express from "express"


import {
  runSecurityTests,
  getSecurityReport,
  getAvailableTests,
} from "../services/spacemonkey/modules/securityTestFramework/index.js"





function createSpacemonkeySecurityTestFrameworkRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/tests",

    (req, res)=>{

      try{

        res.json({ success:true, tests:getAvailableTests() })

      }
      catch(error){

        console.error("Spacemonkey security tests error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/security/tests/report",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSecurityReport() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/security/tests/run",

    (req, res)=>{

      try{

        res.json({ success:true, ...runSecurityTests() })

      }
      catch(error){

        console.error("Spacemonkey security tests run error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecurityTestFrameworkRouter

}
