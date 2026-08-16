import express from "express"


import {
  createExport,
  getExports,
  getExportTypes,
  getLatestExports,
} from "../services/spacemonkey/modules/creatorContextExportGateway/index.js"





function createSpacemonkeyCreatorContextExportGatewayRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/context/exports",

    (req, res)=>{

      try{

        res.json({ success:true, ...getExports() })

      }
      catch(error){

        console.error("Spacemonkey creator context exports error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/exports/types",

    (req, res)=>{

      try{

        res.json({ success:true, ...getExportTypes() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/exports/latest",

    (req, res)=>{

      try{

        res.json({ success:true, exports:getLatestExports() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/exports",

    (req, res)=>{

      try{

        res.json(createExport(req.body || {}))

      }
      catch(error){

        console.error("Spacemonkey creator context exports create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorContextExportGatewayRouter

}
