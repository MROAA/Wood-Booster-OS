import express from "express"


import {
  getSystemInventory,
  findModule,
  getModulesByCategory,
} from "../services/spacemonkey/modules/systemInventory/index.js"





function createSpacemonkeySystemInventoryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/system-inventory",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "system-inventory", modules: getModulesByCategory(category) }
            : getSystemInventory()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey system inventory error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/system-inventory/:id",

    (req, res)=>{

      try{

        const item =
          findModule(req.params.id)


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

  createSpacemonkeySystemInventoryRouter

}
