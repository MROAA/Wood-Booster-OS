import express from "express"


import {
  getDependencyMap,
  getModuleDependencies,
  getStartupOrder,
} from "../services/spacemonkey/modules/moduleDependencyMap/index.js"





function createSpacemonkeyModuleDependencyMapRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/dependency-map",

    (req, res)=>{

      try{

        res.json({ success:true, ...getDependencyMap() })

      }
      catch(error){

        console.error("Spacemonkey module dependency map error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/dependency-map/startup-order",

    (req, res)=>{

      try{

        res.json({ success:true, order:getStartupOrder() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/dependency-map/:moduleId",

    (req, res)=>{

      try{

        const item =
          getModuleDependencies(req.params.moduleId)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, dependencies:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyModuleDependencyMapRouter

}
