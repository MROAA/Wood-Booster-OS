import {
  createSpacemonkeyKnowledgeContext,
} from "./services/spacemonkey/knowledgeAdapter.js"



console.log(
  "STARTING SPACEMONKEY KNOWLEDGE CONTEXT TEST",
)



const result =
  await createSpacemonkeyKnowledgeContext()



console.log(
  "DOCUMENT COUNT:",
  result.count,
)


console.log(
  "CONTEXT LENGTH:",
  result.context.length,
)


console.log(
  result.context.slice(
    0,
    1000,
  ),
)
