import express from "express"


import {
  getSoulLayer,
  getPurpose,
  getEthics,
  getSustainabilityPrinciples,
  getCreatorPhilosophy,
} from "../services/spacemonkey/modules/personalitySoulLayer/index.js"





function createSpacemonkeyPersonalitySoulLayerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/soul",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSoulLayer() })

      }
      catch(error){

        console.error("Spacemonkey personality soul error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/soul/purpose",

    (req, res)=>{

      try{

        res.json({ success:true, purpose:getPurpose() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/soul/ethics",

    (req, res)=>{

      try{

        res.json({ success:true, ethics:getEthics() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/soul/sustainability",

    (req, res)=>{

      try{

        res.json({ success:true, sustainability:getSustainabilityPrinciples() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/soul/creator-philosophy",

    (req, res)=>{

      try{

        res.json({ success:true, philosophy:getCreatorPhilosophy() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalitySoulLayerRouter

}
