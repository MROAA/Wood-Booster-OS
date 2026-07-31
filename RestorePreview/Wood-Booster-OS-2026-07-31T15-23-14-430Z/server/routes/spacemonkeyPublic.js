/*
=====================================
WOOD-BOOSTER AI PLATFORM

SPACEMONKEY PUBLIC ROUTE

MVP INTERNET GATEWAY

Vastuu:
- tarjoaa julkisen Spacemonkey identiteetin
- ei paljasta sisäistä järjestelmää
- ei avaa AI Brainia vielä
- turvallinen Wordpress-integraatiota varten

=====================================
*/


import express from "express"


import {
  createPublicSpacemonkeyContext,
} from "../services/spacemonkey/public/publicContext.js"



import {
  createPublicGuardResult,
} from "../services/spacemonkey/public/publicGuard.js"




const router =
  express.Router()





router.get(
  "/spacemonkey/public",
  (
    req,
    res,
  ) => {


    const publicContext =
      createPublicSpacemonkeyContext()



    const safeResponse =
      createPublicGuardResult(
        publicContext,
      )



    res.json(
      safeResponse,
    )


  },
)





export {

  router as publicSpacemonkeyRouter,

}
