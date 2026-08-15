import express from "express"


import {
  createBackup,
  restoreBackup,
  verifyBackup,
  getBackups,
  getLatestBackup,
} from "../services/spacemonkey/modules/creatorIntelligenceBackupRecovery/index.js"





function createSpacemonkeyCreatorIntelligenceBackupRecoveryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/backups",

    (req, res)=>{

      try{

        res.json({ success:true, ...getBackups() })

      }
      catch(error){

        console.error("Spacemonkey creator backups error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/backups/latest",

    (req, res)=>{

      try{

        res.json({ success:true, backup:getLatestBackup() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/backups/:id/verify",

    (req, res)=>{

      try{

        res.json({ success:true, ...verifyBackup(req.params.id) })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/backups",

    (req, res)=>{

      try{

        const backup =
          createBackup(req.body || {})


        res.json({ success:true, backup })

      }
      catch(error){

        console.error("Spacemonkey creator backups create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/backups/:id/restore",

    (req, res)=>{

      try{

        res.json(restoreBackup(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey creator backups restore error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceBackupRecoveryRouter

}
