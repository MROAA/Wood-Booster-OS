import express from "express"


import {
  checkPermission,
  getPermissions,
  getPermissionEvents,
} from "../services/spacemonkey/modules/creatorContextPermissionEngine/index.js"





function createSpacemonkeyCreatorContextPermissionEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/context/permissions",

    (req, res)=>{

      try{

        res.json({ success:true, ...getPermissions() })

      }
      catch(error){

        console.error("Spacemonkey creator context permissions error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/context/permissions/events",

    (req, res)=>{

      try{

        res.json({ success:true, ...getPermissionEvents() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/context/permissions/check",

    (req, res)=>{

      try{

        res.json({ success:true, ...checkPermission(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator context permissions check error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorContextPermissionEngineRouter

}
