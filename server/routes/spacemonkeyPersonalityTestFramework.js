import express from "express"


import {
  runAllTests,
  getRegisteredTests,
} from "../services/spacemonkey/modules/personalityTestFramework/index.js"

/*
Ei reittiä createTest/runTest:lle - ne ottavat parametrina JS-funktion
(`check`), jota ei voi kuljettaa HTTP-pyynnön JSON-rungossa. Tämä
moduuli on tarkoitettu ohjelmalliseen käyttöön prosessin sisältä (esim.
toisen spacemonkey-moduulin rekisteröimänä testinä), ei suoraan REST-
asiakkaalta - siksi vain lukureitit.
*/





function createSpacemonkeyPersonalityTestFrameworkRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/tests",

    (req, res)=>{

      try{

        res.json({ success:true, ...getRegisteredTests() })

      }
      catch(error){

        console.error("Spacemonkey personality tests error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/personality/tests/run",

    (req, res)=>{

      try{

        res.json({ success:true, ...runAllTests() })

      }
      catch(error){

        console.error("Spacemonkey personality tests run error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityTestFrameworkRouter

}
