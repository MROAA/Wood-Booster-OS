import express from "express"


import {
  createExecutionPlan,
  addTask,
  updatePlanStatus,
  getPlans,
  getActivePlans,
} from "../services/spacemonkey/modules/creatorIntelligenceExecutionPlanner/index.js"





function createSpacemonkeyCreatorIntelligenceExecutionPlannerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/execution-plans",

    (req, res)=>{

      try{

        const active =
          req.query.active === "true"


        const data =
          active
            ? { moduleId: "creator-intelligence-execution-planner", plans: getActivePlans() }
            : getPlans()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey creator execution plans error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/execution-plans",

    (req, res)=>{

      try{

        const plan =
          createExecutionPlan(req.body || {})


        res.json({ success:true, plan })

      }
      catch(error){

        console.error("Spacemonkey creator execution plans create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/execution-plans/task",

    (req, res)=>{

      try{

        res.json({ success:true, plan:addTask(req.body || {}) })

      }
      catch(error){

        console.error("Spacemonkey creator execution plans add task error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/execution-plans/status",

    (req, res)=>{

      try{

        res.json(updatePlanStatus(req.body || {}))

      }
      catch(error){

        console.error("Spacemonkey creator execution plans status error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceExecutionPlannerRouter

}
