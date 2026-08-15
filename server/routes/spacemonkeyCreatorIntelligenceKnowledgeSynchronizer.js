import express from "express"


import {
  validateLearning,
  createKnowledgeProposal,
  approveKnowledgeUpdate,
  getKnowledgeUpdates,
  getApprovedKnowledge,
} from "../services/spacemonkey/modules/creatorIntelligenceKnowledgeSynchronizer/index.js"





function createSpacemonkeyCreatorIntelligenceKnowledgeSynchronizerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/knowledge-sync",

    (req, res)=>{

      try{

        const approved =
          req.query.approved === "true"


        const data =
          approved
            ? { moduleId: "creator-intelligence-knowledge-synchronizer", updates: getApprovedKnowledge() }
            : getKnowledgeUpdates()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator knowledge sync error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/knowledge-sync/validate",

    (req, res)=>{

      try{

        res.json({ success:true, ...validateLearning(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator knowledge sync validate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/knowledge-sync/proposal",

    (req, res)=>{

      try{

        res.json(createKnowledgeProposal(req.body || {}))

      }
      catch(error){

        console.error("Spacemonkey creator knowledge sync proposal error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/knowledge-sync/:id/approve",

    (req, res)=>{

      try{

        res.json(approveKnowledgeUpdate(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey creator knowledge sync approve error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceKnowledgeSynchronizerRouter

}
