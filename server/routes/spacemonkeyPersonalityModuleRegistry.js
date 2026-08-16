import express from "express"


import {
  getPersonalityRegistry,
  findPersonalityModule,
  getModulesByCategory,
  getActiveModules,
} from "../services/spacemonkey/modules/personalityModuleRegistry/index.js"





function createSpacemonkeyPersonalityModuleRegistryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/registry",

    (req, res)=>{

      try{

        const { category, active } =
          req.query


        if(active === "true"){

          return res.json({ success:true, moduleId:"personality-module-registry", modules:getActiveModules() })

        }


        const data =
          category
            ? { moduleId: "personality-module-registry", modules: getModulesByCategory(category) }
            : getPersonalityRegistry()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey personality registry error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/registry/:id",

    (req, res)=>{

      try{

        const item =
          findPersonalityModule(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, module:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityModuleRegistryRouter

}
