import express from "express"


import {
  getSecurityKnowledge,
  findKnowledge,
  getKnowledgeByCategory,
} from "../services/spacemonkey/modules/securityKnowledgeBase/index.js"





function createSpacemonkeySecurityKnowledgeBaseRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/knowledge",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "security-knowledge-base", knowledge: getKnowledgeByCategory(category) }
            : getSecurityKnowledge()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey security knowledge error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/security/knowledge/:id",

    (req, res)=>{

      try{

        const item =
          findKnowledge(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, knowledge:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecurityKnowledgeBaseRouter

}
