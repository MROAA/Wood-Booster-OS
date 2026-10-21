import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"





// Godfilet ovat tämän tiedoston vieressä. Polku lasketaan moduulin
// sijainnista eikä kovakoodata päächeckoutiin: muuten jokainen
// worktree ja siirretty kopio luki päächeckoutin (tai puuttuvan)
// identiteetin. Päächeckoutissa polku on täsmälleen sama kuin ennen.
const SPACEMONKEY_ROOT =

  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "godfiles",
  )



const GODFILE_MANIFEST =
  [
    "01_IDENTITY_GODFILE.md",
    "02_PERSONALITY_GODFILE.md",
    "03_VALUES_GODFILE.md",
    "04_COMMUNICATION_GODFILE.md",
    "05_DECISION_GODFILE.md"
  ]







async function loadGodFile({

  filePath

}){


  const content =

    await fs.readFile(
      filePath,
      "utf-8"
    )


  return {

    content

  }


}








function resolveGodfileDirectory(directory){


  if(!directory){

    return SPACEMONKEY_ROOT

  }



  return path.resolve(
    directory
  )

}







async function loadGodFiles({

  directory

} = {}){


  const godfileDirectory =

    resolveGodfileDirectory(
      directory
    )





  console.log(
    "GODFILE DIRECTORY:",
    godfileDirectory
  )







  const files =
    GODFILE_MANIFEST





  const godfiles = []





  let context = ""








  for(
    const file
    of files
  ){


    const fullPath =

      path.join(
        godfileDirectory,
        file
      )



    const stat =

      await fs.stat(
        fullPath
      )



    if(
      !stat.isFile()
    ){

      continue

    }







    const data =

      await loadGodFile({

        filePath:
          fullPath

      })







    godfiles.push({

      file,

      data

    })







    context += `

==================================================
GODFILE: ${file}
==================================================

${data.content}

`

  }







  return {


    system:

      "Spacemonkey Godfile Loader",


    version:

      "2.0.2",


    status:

      "loaded",


    directory:

      godfileDirectory,


    count:

      godfiles.length,


    context,


    godfiles


  }


}







export {

  loadGodFile,

  loadGodFiles

}
