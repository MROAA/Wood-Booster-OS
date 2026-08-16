import express from "express"
import path from "node:path"
import { fileURLToPath } from "node:url"


import {
  locateProtectedAlias,
  getProtectionStatus,
} from "../services/spacemonkey/modules/secretAliasProtection/index.js"

/*
Sama hakemistoturva kuin spacemonkeySecretProtection.js:ssä -
locateProtectedAlias() lukee rekursiivisesti läpi minkä tahansa
sille annetun hakemiston, joten reitti hyväksyy vain
projektijuureen suhteutetun alihakemiston.
*/

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PROJECT_ROOT = path.resolve(__dirname, "..", "..")


function resolveSafeProjectDirectory(relativeDir) {

  const relative = String(relativeDir || "").replace(/^[/\\]+/, "")

  const resolved = path.resolve(PROJECT_ROOT, relative)

  const withinRoot =
    resolved === PROJECT_ROOT || resolved.startsWith(PROJECT_ROOT + path.sep)

  if (!withinRoot) {
    return { ok: false, code: "path_traversal_blocked" }
  }

  return { ok: true, absolutePath: resolved }

}



function createSpacemonkeySecretAliasProtectionRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/secret-alias-protection",

    (req, res)=>{

      try{

        res.json({ success:true, ...getProtectionStatus() })

      }
      catch(error){

        console.error("Spacemonkey secret alias protection error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/security/secret-alias-protection/locate",

    (req, res)=>{

      try{

        const check =
          resolveSafeProjectDirectory(req.body?.directory)


        if(!check.ok){

          return res.status(400).json({ success:false, error:check.code })

        }


        const result =
          locateProtectedAlias(req.body?.aliasId, check.absolutePath)


        res.json({ success:true, ...result })

      }
      catch(error){

        console.error("Spacemonkey secret alias protection locate error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecretAliasProtectionRouter

}
