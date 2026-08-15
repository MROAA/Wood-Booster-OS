import express from "express"


import {
  getIdentity,
  getValues,
  getMission,
  getCreatorRelationship,
  getPersonalityFoundation,
} from "../services/spacemonkey/modules/personalityIdentityCore/index.js"





function createSpacemonkeyPersonalityIdentityCoreRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/identity",

    (req, res)=>{

      try{

        res.json({ success:true, ...getIdentity() })

      }
      catch(error){

        console.error("Spacemonkey personality identity error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/identity/values",

    (req, res)=>{

      try{

        res.json({ success:true, values:getValues() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/identity/mission",

    (req, res)=>{

      try{

        res.json({ success:true, mission:getMission() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/identity/creator",

    (req, res)=>{

      try{

        res.json({ success:true, creator:getCreatorRelationship() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/identity/foundation",

    (req, res)=>{

      try{

        res.json({ success:true, foundation:getPersonalityFoundation() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityIdentityCoreRouter

}
