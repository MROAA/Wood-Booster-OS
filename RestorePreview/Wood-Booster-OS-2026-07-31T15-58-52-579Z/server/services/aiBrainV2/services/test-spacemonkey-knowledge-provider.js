import {
  createSpacemonkeyRuntimeContext
} from "./spacemonkeyRuntimeContextProvider.js"



import {
  getSpacemonkeyKnowledge,
  getKnowledgeSources,
  findKnowledgeByCategory,
} from "../spacemonkey/spacemonkeyKnowledgeProvider.js"




const runtimeContext =
  createSpacemonkeyRuntimeContext({

    message:
      "Mikä on Spacemonkeyn persoonallisuus?"

  })



console.log(
  "KNOWLEDGE PROVIDER TEST"
)



console.dir(

  getSpacemonkeyKnowledge({

    runtimeContext

  }),

  {
    depth:2
  }

)



console.log(
  "SOURCES"
)


console.log(

  getKnowledgeSources({

    runtimeContext

  })

)



console.log(
  "IDENTITY FILES"
)


console.dir(

  findKnowledgeByCategory({

    runtimeContext,

    category:
      "identity"

  }).map(
    item =>
      item.id
  )

)
