import express from "express"


import {
  createSchedule,
  executeSchedule,
  getSchedules,
  getExecutionHistory,
  getLatestExecutions,
} from "../services/spacemonkey/modules/creatorIntelligenceScheduler/index.js"





function createSpacemonkeyCreatorIntelligenceSchedulerRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/creator/schedules",

    (req, res)=>{

      try{

        res.json({ success:true, ...getSchedules() })

      }
      catch(error){

        console.error("Spacemonkey creator schedules error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/schedules/executions",

    (req, res)=>{

      try{

        res.json({ success:true, ...getExecutionHistory() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/creator/schedules/executions/latest",

    (req, res)=>{

      try{

        res.json({ success:true, executions:getLatestExecutions() })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/schedules",

    (req, res)=>{

      try{

        const schedule =
          createSchedule(req.body || {})


        res.json({ success:true, schedule })

      }
      catch(error){

        console.error("Spacemonkey creator schedules create error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/creator/schedules/:id/execute",

    (req, res)=>{

      try{

        res.json(executeSchedule(req.params.id))

      }
      catch(error){

        console.error("Spacemonkey creator schedules execute error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyCreatorIntelligenceSchedulerRouter

}
