import express from "express"


import {
  addPersonalityMemory,
  getPersonalityMemory,
  findMemoriesByCategory,
  getLatestMemories,
} from "../services/spacemonkey/modules/personalityMemory/index.js"





function createSpacemonkeyPersonalityMemoryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/memory",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "personality-memory", memories: findMemoriesByCategory(category) }
            : getPersonalityMemory()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey personality memory error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/memory/latest",

    (req, res)=>{

      try{

        res.json({ success:true, memories:getLatestMemories() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/memory",

    (req, res)=>{

      try{

        const memory =
          addPersonalityMemory(req.body || {})


        res.json({ success:true, memory })

      }
      catch(error){

        console.error("Spacemonkey personality memory create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityMemoryRouter

}
