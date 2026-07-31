import fs from "fs"
import path from "path"



const GODFILE_ROOT =
  path.resolve(
    process.cwd(),
    "Spacemonkey"
  )



function normalizeText(value){

  return String(value || "")
    .toLowerCase()

}





function determineCategory(filename){

  const name =
    normalizeText(
      filename
    )



  /*
  SECURITY ensin

  Esimerkiksi:
  IDENTITY SECURITY ENGINE.txt

  kuuluu turvallisuuteen,
  ei identiteettiin.
  */


  if(
    name.includes("security") ||
    name.includes("guard") ||
    name.includes("protection") ||
    name.includes("jailbreak") ||
    name.includes("ethics")
  ){

    return "security"

  }





  if(
    name.includes("personality") ||
    name.includes("identity") ||
    name.includes("voice") ||
    name.includes("behavior")
  ){

    return "identity"

  }





  if(
    name.includes("memory") ||
    name.includes("learning")
  ){

    return "memory"

  }





  if(
    name.includes("python") ||
    name.includes("javascript") ||
    name.includes("cpp") ||
    name.includes("code") ||
    name.includes("program")
  ){

    return "coding"

  }





  if(
    name.includes("creator") ||
    name.includes("marc")
  ){

    return "creator"

  }





  if(
    name.includes("wood") ||
    name.includes("business") ||
    name.includes("customer")
  ){

    return "business"

  }





  return "general"

}







function calculatePriority(category){

  const priorities = {


    identity:
      100,


    security:
      95,


    creator:
      90,


    memory:
      85,


    coding:
      85,


    business:
      70,


    general:
      50

  }



  return (
    priorities[category]
    ||
    50
  )

}







function createIndexEntry(filePath){

  const filename =
    path.basename(
      filePath
    )



  const content =
    fs.readFileSync(
      filePath,
      "utf8"
    )



  const category =
    determineCategory(
      filename
    )



  const stats =
    fs.statSync(
      filePath
    )



  return {


    id:
      filename,


    path:
      filePath,


    source:
      "godfiles",


    category,


    priority:
      calculatePriority(
        category
      ),


    size:
      stats.size,


    content


  }

}







function buildGodfileIndex(){

  const index = []



  function scan(directory){

    const entries =
      fs.readdirSync(
        directory,
        {
          withFileTypes:true
        }
      )



    for(
      const entry
      of entries
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

        index.push(

          createIndexEntry(
            fullPath
          )

        )

      }

    }

  }



  if(
    !fs.existsSync(
      GODFILE_ROOT
    )
  ){

    throw new Error(
      `Godfile root missing: ${GODFILE_ROOT}`
    )

  }



  scan(
    GODFILE_ROOT
  )



  return index

}







export {

  buildGodfileIndex

}
