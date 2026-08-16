import express from "express"


import {
  createDiagnosticReport,
  getDiagnosticStatus,
} from "../services/spacemonkey/modules/systemDiagnostics/index.js"





function createSpacemonkeySystemDiagnosticsRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/system-diagnostics",

    (req, res)=>{

      try{

        res.json({ success:true, ...getDiagnosticStatus() })

      }
      catch(error){

        console.error("Spacemonkey system diagnostics error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/system-diagnostics/report",

    (req, res)=>{

      try{

        res.json({ success:true, ...createDiagnosticReport() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySystemDiagnosticsRouter

}
