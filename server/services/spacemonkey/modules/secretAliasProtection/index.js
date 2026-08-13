import fs from "fs"
import path from "path"


const MODULE_ID = "secret-alias-protection"



const protectedAliases = [

  {
    id:
      "protected-secret-03",

    alias:
      "Herra X",

    environmentKey:
      "SPACEMONKEY_SECRET_THIRD",

    accessMode:
      "location-only",

    protection:
      "critical",

  },

]



function getSecretValue(secret){

  return process.env[
    secret.environmentKey
  ] || null

}



function findFilesContainingSecret(directory, secret){

  const matches = []

  const value =
    getSecretValue(secret)


  if (!value){

    return matches

  }



  function scan(currentPath){

    const entries =
      fs.readdirSync(
        currentPath,
        {
          withFileTypes:true
        }
      )


    for (const entry of entries){

      if (
        entry.name === "node_modules" ||
        entry.name === ".git"
      ){

        continue

      }


      const fullPath =
        path.join(
          currentPath,
          entry.name
        )


      if (entry.isDirectory()){

        scan(fullPath)

        continue

      }


      try {

        const content =
          fs.readFileSync(
            fullPath,
            "utf8"
          )


        if (
          content.includes(value)
        ){

          matches.push(fullPath)

        }

      }
      catch(error){

        continue

      }

    }

  }


  scan(directory)


  return matches

}



function locateProtectedAlias(aliasId, directory){

  const secret =
    protectedAliases.find(
      item =>
        item.id === aliasId
    )


  if (!secret){

    return {

      error:
        "Unknown protected identifier."

    }

  }



  const files =
    findFilesContainingSecret(
      directory,
      secret
    )


  return {

    moduleId:
      MODULE_ID,

    alias:
      secret.alias,

    matches:
      files.length,

    files,

    mode:
      secret.accessMode,

  }

}



function getProtectionStatus(){

  return {

    moduleId:
      MODULE_ID,

    protectedItems:
      protectedAliases.length,

    mode:
      "alias-only-output",

  }

}



export {

  MODULE_ID,

  locateProtectedAlias,

  getProtectionStatus,

}
