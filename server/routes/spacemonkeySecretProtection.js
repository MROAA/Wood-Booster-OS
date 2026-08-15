import express from "express"
import path from "node:path"
import { fileURLToPath } from "node:url"


import {
  searchFiles,
  getProtectionStatus,
} from "../services/spacemonkey/modules/secretProtection/index.js"

/*
searchFiles() recursively reads every file under whatever directory
it's given, looking for a secret value from an env var - so the
directory it's pointed at must never come from the request unchecked
(path traversal / arbitrary filesystem read risk). This route accepts
only a project-relative subdirectory and resolves it against the
repo root, rejecting anything that would land outside it - same
"reject absolute paths, verify the resolved path stays under root"
boundary check used by CodeChangeDeveloper's projectSandbox.js, just
for a directory instead of a single file.
*/

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// routes/ -> server/ -> repo root
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



function createSpacemonkeySecretProtectionRouter(){


  const router =
    express.Router()



  router.get(

    "/spacemonkey/security/secret-protection",

    (req, res)=>{

      try{

        res.json({ success:true, ...getProtectionStatus() })

      }
      catch(error){

        console.error("Spacemonkey secret protection error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  router.post(

    "/spacemonkey/security/secret-protection/search",

    (req, res)=>{

      try{

        const check =
          resolveSafeProjectDirectory(req.body?.directory)


        if(!check.ok){

          return res.status(400).json({ success:false, error:check.code })

        }


        res.json({ success:true, ...searchFiles(check.absolutePath) })

      }
      catch(error){

        console.error("Spacemonkey secret protection search error:", error)

        res.status(500).json({ success:false, error:error.message })

      }

    }

  )



  return router

}





export {

  createSpacemonkeySecretProtectionRouter

}
