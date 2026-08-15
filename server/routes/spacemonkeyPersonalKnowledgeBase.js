import express from "express"


import {
  getPersonalKnowledgeBase,
  findKnowledgeEntry,
  getKnowledgeByCategory,
} from "../services/spacemonkey/modules/personalKnowledgeBase/index.js"





function createSpacemonkeyPersonalKnowledgeBaseRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personal-knowledge",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "personal-knowledge-base", entries: getKnowledgeByCategory(category) }
            : getPersonalKnowledgeBase()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey personal knowledge base error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personal-knowledge/:id",

    (req, res)=>{

      try{

        const item =
          findKnowledgeEntry(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, entry:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalKnowledgeBaseRouter

}
