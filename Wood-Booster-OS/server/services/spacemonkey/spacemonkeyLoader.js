import fs from "fs"
import path from "path"



const SPACEMONKEY_ROOT =
  path.resolve(
    process.cwd(),
    "services/aiBrainV2/system/spacemonkey"
  )





function readFileSafe(filePath){

  try {

    return fs.readFileSync(
      filePath,
      "utf-8"
    )

  }

  catch(error){

    console.error(
      "Spacemonkey file missing:",
      filePath
    )

    return null

  }

}





function loadSpacemonkeyFile(filename){

  const filePath =
    path.join(
      SPACEMONKEY_ROOT,
      filename
    )


  return readFileSafe(
    filePath
  )

}





function getSpacemonkeyIdentity(){

  return {


    root:
      SPACEMONKEY_ROOT,



    manifest:

      loadSpacemonkeyFile(
        "godfiles/spacemonkey_identity.json"
      ),



    coreIndex:

      loadSpacemonkeyFile(
        "identity/spacemonkeyCoreIdentity.js"
      ),


  }

}





export {

  getSpacemonkeyIdentity

}
