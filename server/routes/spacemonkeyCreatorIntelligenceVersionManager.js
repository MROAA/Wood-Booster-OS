import express from "express"


import {
  createVersion,
  approveVersion,
  rollbackVersion,
  getVersionHistory,
  getAllVersions,
} from "../services/spacemonkey/modules/creatorIntelligenceVersionManager/index.js"





function createSpacemonkeyCreatorIntelligenceVersionManagerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/versions",

    (req, res)=>{

      try{

        const knowledgeId =
          req.query.knowledgeId


        const data =
          knowledgeId
            ? { moduleId: "creator-intelligence-version-manager", versions: getVersionHistory(knowledgeId) }
            : getAllVersions()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator versions error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/versions",

    (req, res)=>{

      try{

        const version =
          createVersion(req.body || {})


        res.json({ success:true, version })

      }
      catch(error){

        console.error("Spacemonkey creator versions create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/versions/:id/approve",

    (req, res)=>{

      try{

        res.json(approveVersion(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey creator versions approve error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/versions/rollback",

    (req, res)=>{

      try{

        const knowledgeId =
          req.body?.knowledgeId


        res.json(rollbackVersion(knowledgeId))

      }
      catch(error){

        console.error("Spacemonkey creator versions rollback error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceVersionManagerRouter

}
