import express from "express"


import {
  addCreatorKnowledge,
  getCreatorKnowledge,
  getByCategory,
  searchKnowledge,
  getLatestKnowledge,
} from "../services/spacemonkey/modules/creatorKnowledgeVault/index.js"





function createSpacemonkeyCreatorKnowledgeVaultRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/knowledge-vault",

    (req, res)=>{

      try{

        const { category, search } =
          req.query


        if(search){

          return res.json({ success:true, entries:searchKnowledge(search) })

        }


        const data =
          category
            ? { moduleId: "creator-knowledge-vault", entries: getByCategory(category) }
            : getCreatorKnowledge()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator knowledge vault error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/knowledge-vault/latest",

    (req, res)=>{

      try{

        res.json({ success:true, entries:getLatestKnowledge() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/knowledge-vault",

    (req, res)=>{

      try{

        const entry =
          addCreatorKnowledge(req.body || {})


        res.json({ success:true, entry })

      }
      catch(error){

        console.error("Spacemonkey creator knowledge vault add error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorKnowledgeVaultRouter

}
