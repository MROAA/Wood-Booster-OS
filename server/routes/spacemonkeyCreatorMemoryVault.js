import express from "express"


import {
  getCreatorMemories,
  findMemory,
  getImportantMemories,
} from "../services/spacemonkey/modules/creatorMemoryVault/index.js"





function createSpacemonkeyCreatorMemoryVaultRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/memory-vault",

    (req, res)=>{

      try{

        const important =
          req.query.important === "true"


        const data =
          important
            ? { moduleId: "creator-memory-vault", memories: getImportantMemories() }
            : getCreatorMemories()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator memory vault error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/memory-vault/:id",

    (req, res)=>{

      try{

        const item =
          findMemory(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, memory:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorMemoryVaultRouter

}
