import {
  createSpacemonkeyKnowledgeContext
} from "./spacemonkeyKnowledgeRuntimeAdapter.js"



const result =
  createSpacemonkeyKnowledgeContext({

    message:
      "Mikä on Spacemonkeyn persoonallisuus?"

  })



console.log(
  "SPACEMONKEY KNOWLEDGE RUNTIME"
)


console.dir(
  result,
  {
    depth:null
  }
)
