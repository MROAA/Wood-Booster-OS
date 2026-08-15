import express from "express"


import {
  createVersion,
  getVersions,
  getLatestVersion,
  rollbackVersion,
} from "../services/spacemonkey/modules/personalityVersionControl/index.js"





function createSpacemonkeyPersonalityVersionControlRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/versions",

    (req, res)=>{

      try{

        res.json({ success:true, ...getVersions() })

      }
      catch(error){

        console.error("Spacemonkey personality versions error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/versions/latest",

    (req, res)=>{

      try{

        res.json({ success:true, version:getLatestVersion() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/versions",

    (req, res)=>{

      try{

        const version =
          createVersion(req.body || {})


        res.json({ success:true, version })

      }
      catch(error){

        console.error("Spacemonkey personality versions create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/versions/:id/rollback",

    (req, res)=>{

      try{

        res.json(rollbackVersion(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey personality versions rollback error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityVersionControlRouter

}
