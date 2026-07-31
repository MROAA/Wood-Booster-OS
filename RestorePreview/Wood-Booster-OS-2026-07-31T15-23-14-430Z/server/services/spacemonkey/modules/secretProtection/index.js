import fs from "fs"
import path from "path"


const MODULE_ID = "secret-protection"



function getProtectedTerm(){

  return process.env.SPACEMONKEY_SECRET_TERM || null

}



function searchFiles(directory){

  const results = []

  const secret =
    getProtectedTerm()


  if (!secret){

    return {

      error:
        "Protected term is not configured."

    }

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

      const fullPath =
        path.join(
          currentPath,
          entry.name
        )


      if (
        entry.name === "node_modules" ||
        entry.name === ".git"
      ){

        continue

      }


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
          content.includes(secret)
        ){

          results.push(
            fullPath
          )

        }


      }
      catch(error){

        continue

      }

    }

  }


  scan(directory)


  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    matches:
      results.length,

    files:
      results,

  }

}



function getProtectionStatus(){

  return {

    moduleId:
      MODULE_ID,

    protected:
      Boolean(
        getProtectedTerm()
      ),

    mode:
      "protected-search-only",

  }

}



export {

  MODULE_ID,

  searchFiles,

  getProtectionStatus,

}
