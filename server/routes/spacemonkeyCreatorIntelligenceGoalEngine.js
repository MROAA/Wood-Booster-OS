import express from "express"


import {
  createGoal,
  updateProgress,
  addMilestone,
  getGoals,
  getActiveGoals,
} from "../services/spacemonkey/modules/creatorIntelligenceGoalEngine/index.js"





function createSpacemonkeyCreatorIntelligenceGoalEngineRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/goals",

    (req, res)=>{

      try{

        const active =
          req.query.active === "true"


        const data =
          active
            ? { moduleId: "creator-intelligence-goal-engine", goals: getActiveGoals() }
            : getGoals()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator goals error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/goals",

    (req, res)=>{

      try{

        const goal =
          createGoal(req.body || {})


        res.json({ success:true, goal })

      }
      catch(error){

        console.error("Spacemonkey creator goals create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/goals/progress",

    (req, res)=>{

      try{

        const result =
          updateProgress(req.body || {})


        res.json({ success:result.success !== false, ...result })

      }
      catch(error){

        console.error("Spacemonkey creator goals progress error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/goals/milestone",

    (req, res)=>{

      try{

        const result =
          addMilestone(req.body || {})


        res.json({ success:true, goal:result })

      }
      catch(error){

        console.error("Spacemonkey creator goals milestone error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceGoalEngineRouter

}
