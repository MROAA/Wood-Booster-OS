import fs from "fs/promises"
import path from "path"



const KNOWLEDGE_PATH =
  path.join(
    process.cwd(),
    "ai-knowledge",
  )





export async function readKnowledgeFiles() {


  const files =
    await collectFiles(
      KNOWLEDGE_PATH,
    )



  const documents = []





  for (const file of files) {


    if (

      !file.endsWith(".txt")

    ) {

      continue

    }





    const content =

      await fs.readFile(

        file,

        "utf-8"

      )






    const filename =

      path.basename(file)







    documents.push({

      file:

        filename,



      path:

        file,



      content,



      metadata:

        classifyKnowledge(

          filename

        )


    })


  }




  return documents


}









function classifyKnowledge(

  filename

) {


  const name =

    filename.toLowerCase()






  /*
  ============================
  INTERNAL SYSTEM
  ============================
  */


  if (

    containsAny(

      name,

      [

        "ai_",

        "agent",

        "system",

        "protocol",

        "framework",

        "os_"

      ]

    )

  ) {


    return {


      category:"internal",


      visibility:"private",


      priority:1


    }


  }








  /*
  ============================
  BRAND
  ============================
  */


  if (

    containsAny(

      name,

      [

        "brand",

        "filosofia",

        "vision",

        "worldview",

        "mindset",

        "why"

      ]

    )

  ) {


    return {


      category:"brand",


      visibility:"public",


      priority:10


    }


  }








  /*
  ============================
  PRODUCTS
  ============================
  */


  if (

    containsAny(

      name,

      [

        "product",

        "tuote",

        "wood-booster"

      ]

    )

  ) {


    return {


      category:"business",


      visibility:"public",


      priority:9


    }


  }








  /*
  ============================
  DEVELOPMENT
  ============================
  */


  if (

    containsAny(

      name,

      [

        "code",

        "project",

        "development",

        "database"

      ]

    )

  ) {


    return {


      category:"project",


      visibility:"private",


      priority:5


    }


  }








  return {


    category:"general",


    visibility:"public",


    priority:3


  }


}









function containsAny(

  text,

  words

) {


  return words.some(

    word =>

      text.includes(word)

  )


}









async function collectFiles(

  directory

) {


  const entries =

    await fs.readdir(

      directory,

      {

        withFileTypes:true,

      },

    )



  const files = []





  for (

    const entry of entries

  ) {



    const fullPath =

      path.join(

        directory,

        entry.name

      )





    if (

      entry.isDirectory()

    ) {


      const nested =

        await collectFiles(

          fullPath

        )


      files.push(

        ...nested

      )


    }


    else {


      files.push(

        fullPath

      )


    }


  }



  return files


}