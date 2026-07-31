/*
=====================================

WOOD-BOOSTER AI BRAIN V2

GODFILE KNOWLEDGE PROVIDER V2


Vastuut:

- lataa kaikki Spacemonkey Godfilet
- muuttaa ne Knowledge Layer muotoon


=====================================
*/


import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"







const __filename =

  fileURLToPath(
    import.meta.url
  )



const __dirname =

  path.dirname(
    __filename
  )







const GODFILE_ROOT =

  path.resolve(

    __dirname,

    "../../../../../Spacemonkey"

  )







function collectGodfiles(){


  const files = []



  function scan(directory){


    const entries =

      fs.readdirSync(

        directory,

        {
          withFileTypes:true
        }

      )





    for(
      const entry of entries
    ){


      const fullPath =

        path.join(

          directory,

          entry.name

        )





      if(
        entry.isDirectory()
      ){

        scan(
          fullPath
        )

      }



      else if(

        entry.name.endsWith(".txt")

        ||

        entry.name.endsWith(".godfile")

      ){

        files.push(
          fullPath
        )

      }


    }


  }







  if(
    !fs.existsSync(
      GODFILE_ROOT
    )
  ){

    return []

  }







  scan(
    GODFILE_ROOT
  )



  return files


}









function readGodfile(filePath){


  const content =

    fs.readFileSync(

      filePath,

      "utf8"

    )





  return {


    id:

      path.basename(
        filePath
      ),



    source:

      "godfiles",



    category:

      "spacemonkey",



    priority:

      100,



    content,



    metadata:{

      file:

        filePath

    }


  }


}









function loadGodfileKnowledge(){


  const files =

    collectGodfiles()





  return files.map(

    file =>

      readGodfile(file)

  )


}







export {

  loadGodfileKnowledge

}
