import {
  loadFinnishIdentity,
} from "./services/aiBrainV2/engines/finnishIdentityEngine.js"


import {
  createFinnishContext,
} from "./services/aiBrainV2/engines/finnishContextAdapter.js"



const identity =
  await loadFinnishIdentity()



const context =
  createFinnishContext({
    identity,
  })



console.log(
  context,
)
