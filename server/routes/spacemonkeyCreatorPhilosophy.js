import express from "express"


import {
  getCreatorPhilosophy,
  findPrinciple,
  getPrinciplesByCategory,
} from "../services/spacemonkey/modules/creatorPhilosophy/index.js"





function createSpacemonkeyCreatorPhilosophyRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/philosophy",

    (req, res)=>{

      try{

        const category =
          req.query.category


        const data =
          category
            ? { moduleId: "creator-philosophy", principles: getPrinciplesByCategory(category) }
            : getCreatorPhilosophy()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator philosophy error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/philosophy/:id",

    (req, res)=>{

      try{

        const item =
          findPrinciple(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, principle:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorPhilosophyRouter

}
