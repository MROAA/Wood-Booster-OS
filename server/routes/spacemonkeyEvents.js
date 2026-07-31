/*
=====================================

SPACEMONKEY EVENTS ROUTER

Event Bus API Gateway

MVP

=====================================
*/


import express from "express"


import {
  emit,
  getEventHistory,
} from "../services/spacemonkey/spacemonkeyEventBus.js"







function createSpacemonkeyEventsRouter(){


  const router =
    express.Router()







  router.get(

    "/spacemonkey/events",

    (
      req,
      res
    )=>{


      res.json({

        success:
          true,


        count:
          getEventHistory().length,


        events:
          getEventHistory(),

      })


    }

  )







  router.post(

    "/spacemonkey/events",

    (
      req,
      res
    )=>{


      const {
        event,
        payload,
      } =
      req.body







      if(
        !event
      ){


        return res
          .status(400)
          .json({

            success:
              false,


            error:
              "Event name missing",

          })


      }







      const created =
        emit(

          event,

          payload || {}

        )







      res.json({

        success:
          true,


        event:
          created,

      })


    }

  )







  return router


}







export {

  createSpacemonkeyEventsRouter

}
