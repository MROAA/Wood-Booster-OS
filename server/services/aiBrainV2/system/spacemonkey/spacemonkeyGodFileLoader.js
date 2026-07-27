import fs from "fs/promises"
import path from "path"


const DEFAULT_GODFILE_DIRECTORY =
  path.resolve(
    process.cwd(),
    "../Spacemonkey"
  )



async function loadGodFile({

  filePath

}) {


  if(!filePath){

    throw new Error(
      "Godfile path required"
    )

  }


  const content =
    await fs.readFile(
      filePath,
      "utf-8"
    )


  return JSON.parse(
    content
  )

}





async function loadGodFiles({

  directory =
    DEFAULT_GODFILE_DIRECTORY

} = {}) {


  try {


    const files =
      await fs.readdir(
        directory
      )


    const godfiles = []



    for(
      const file
      of files
    ){


      if(
        !file.endsWith(".json")
      ){

        continue

      }



      const fullPath =
        path.join(
          directory,
          file
        )



      const data =
        await loadGodFile({

          filePath:
            fullPath

        })



      godfiles.push({

        file,

        data

      })

    }



    return {


      system:
        "Spacemonkey Godfile Loader",


      version:
        "1.0.0",


      status:
        "loaded",


      directory,


      count:
        godfiles.length,


      godfiles


    }


  }

  catch(error){


    return {


      system:
        "Spacemonkey Godfile Loader",


      version:
        "1.0.0",


      status:
        "empty",


      directory,


      count:
        0,


      godfiles: [],


      error:
        error.message

    }

  }

}





export {

  loadGodFile,

  loadGodFiles

}
