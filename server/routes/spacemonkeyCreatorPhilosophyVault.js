import express from "express"


import {
  getCreatorPhilosophyVault,
  getDesignPhilosophy,
  getDevelopmentPrinciples,
  getDecisionPatterns,
  getVisionHistory,
} from "../services/spacemonkey/modules/creatorPhilosophyVault/index.js"





function createSpacemonkeyCreatorPhilosophyVaultRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/philosophy-vault",

    (req, res)=>{

      try{

        res.json({ success:true, ...getCreatorPhilosophyVault() })

      }
      catch(error){

        console.error("Spacemonkey creator philosophy vault error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/philosophy-vault/design",

    (req, res)=>{

      try{

        res.json({ success:true, designPhilosophy:getDesignPhilosophy() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/philosophy-vault/development-principles",

    (req, res)=>{

      try{

        res.json({ success:true, developmentPrinciples:getDevelopmentPrinciples() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/philosophy-vault/decision-patterns",

    (req, res)=>{

      try{

        res.json({ success:true, decisionPatterns:getDecisionPatterns() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/philosophy-vault/vision-history",

    (req, res)=>{

      try{

        res.json({ success:true, visionHistory:getVisionHistory() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorPhilosophyVaultRouter

}
