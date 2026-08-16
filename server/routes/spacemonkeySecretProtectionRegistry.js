import express from "express"


import {
  getSecretRegistry,
  findSecretPolicy,
  getCriticalSecrets,
} from "../services/spacemonkey/modules/secretProtectionRegistry/index.js"





function createSpacemonkeySecretProtectionRegistryRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/secret-registry",

    (req, res)=>{

      try{

        const critical =
          req.query.critical === "true"


        const data =
          critical
            ? { moduleId: "secret-protection-registry", secrets: getCriticalSecrets() }
            : getSecretRegistry()


        res.json({ success:true, ...data })

      }
      catch(error){

        console.error("Spacemonkey secret registry error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.get(

    "/spacemonkey/security/secret-registry/:id",

    (req, res)=>{

      try{

        const item =
          findSecretPolicy(req.params.id)


        if(!item){

          return res.status(404).json({ success:false, error:"not found" })

        }


        res.json({ success:true, policy:item })

      }
      catch(error){

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecretProtectionRegistryRouter

}
