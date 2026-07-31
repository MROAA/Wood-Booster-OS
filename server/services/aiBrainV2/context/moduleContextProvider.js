import {
  loadModuleKnowledge,
} from "../knowledge/providers/moduleProvider.js"


function createModuleContext() {

  try {

    const result =
      loadModuleKnowledge()


    if (
      !result ||
      !result.success
    ) {

      return ""

    }


    return (

      result.documents

        .slice(
          0,
          10,
        )

        .map(

          module => `

SYSTEM MODULE:

${module.content}

`

        )

        .join("\n")

    )


  } catch(error) {

    return ""

  }

}


export {
  createModuleContext,
}
