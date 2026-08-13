import fs from "fs"
import path from "path"



const IDENTITY_JSON_PATH =

  path.join(
    import.meta.dirname,
    "..",
    "godfiles",
    "spacemonkey_identity.json"
  )



let cachedIdentity = null



function getCanonicalIdentity(){

  if(cachedIdentity){

    return cachedIdentity

  }


  const raw =

    fs.readFileSync(
      IDENTITY_JSON_PATH,
      "utf-8"
    )


  cachedIdentity =

    JSON.parse(raw)


  return cachedIdentity

}



export {

  getCanonicalIdentity

}
