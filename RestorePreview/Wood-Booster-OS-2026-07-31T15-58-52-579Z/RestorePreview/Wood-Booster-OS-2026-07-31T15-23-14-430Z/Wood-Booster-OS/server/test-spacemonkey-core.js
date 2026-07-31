import {
  loadSpacemonkeyKnowledge,
} from "./services/spacemonkey/knowledgeLoader.js"



console.log(
  "STARTING SPACEMONKEY CORE TEST",
)



const result =
  await loadSpacemonkeyKnowledge()



console.log(
  JSON.stringify(
    result,
    null,
    2,
  ),
)
