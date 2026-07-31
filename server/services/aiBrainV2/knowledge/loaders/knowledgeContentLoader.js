import fs from "fs"



function loadKnowledgeContent(
  knowledgeItems = []
){

  return knowledgeItems.map(
    item => {

      let content = ""


      try {

        content =
          fs.readFileSync(
            item.path,
            "utf8"
          )

      }

      catch(error){

        content =
          "Knowledge content unavailable."

      }



      return {

        id:
          item.id,


        category:
          item.category,


        priority:
          item.priority,


        content,


        metadata:{

          source:
            item.path

        }

      }

    }
  )

}



export {

  loadKnowledgeContent

}
