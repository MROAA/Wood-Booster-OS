import express from "express"


import {
  getPersonalityRegistry,
  findPersonalityRule,
  getRulesByCategory,
  getHighPriorityRules,
} from "../services/spacemonkey/modules/personalityRuleRegistry/index.js"





function createSpacemonkeyPersonalityRuleRegistryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/personality/rules",

    (req, res)=>{

      try{

        const { category, priority } =
          req.query


        if(priority === "high"){

          return res.json({ success:true, moduleId:"personality-rule-registry", rules:getHighPriorityRules() })

        }


        const data =
          category
            ? { moduleId: "personality-rule-registry", rules: getRulesByCategory(category) }
            : getPersonalityRegistry()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey personality rules error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/personality/rules/:id",

    (req, res)=>{

      try{

        const item =
          findPersonalityRule(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, rule:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeyPersonalityRuleRegistryRouter

}
