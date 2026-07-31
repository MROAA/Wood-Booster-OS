import {
  loadFinnishIdentity,
  createFinnishIdentityContext,
} from "./services/aiBrainV2/engines/finnishIdentityEngine.js"



const result =
  await loadFinnishIdentity()


console.log(
  "FINNISH DOCUMENTS:",
  result.documentCount,
)


console.log(
  createFinnishIdentityContext(
    result,
  ).slice(
    0,
    500,
  ),
)
