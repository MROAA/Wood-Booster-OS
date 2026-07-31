import {
  loadAllKnowledge
} from "./loaders/knowledgeLoader.js"



const result =
  loadAllKnowledge()



console.log(
  "KNOWLEDGE LOADER RESULT"
)


console.dir(
  result,
  {
    depth:null
  }
)
