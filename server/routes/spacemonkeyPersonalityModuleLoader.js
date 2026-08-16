import express from "express"


import {
  validateModule,
  loadModule,
  getLoadedModules,
  clearLoadedModules,
} from "../services/spacemonkey/modules/personalityModuleLoader/index.js"





function createSpacemonkeyPersonalityModuleLoaderRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/module-loader",

    (req, res)=>{

      try{

        res.json({ success:true, ...getLoadedModules() })

      }
      catch(error){

        console.error("Spacemonkey personality module loader error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/module-loader/validate",

    (req, res)=>{

      try{

        res.json({ success:true, ...validateModule(req.body) })

      }
      catch(error){

        console.error("Spacemonkey personality module loader validate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/module-loader",

    (req, res)=>{

      try{

        res.json(loadModule(req.body))

      }
      catch(error){

        console.error("Spacemonkey personality module loader load error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/module-loader/clear",

    (req, res)=>{

      try{

        res.json({ success:true, ...clearLoadedModules() })

      }
      catch(error){

        console.error("Spacemonkey personality module loader clear error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityModuleLoaderRouter

}
