import {
  getSpacemonkeyIdentityRegistry,
} from "./services/aiBrainV2/system/spacemonkey/identity/spacemonkeyIdentityRegistry.js"



console.log(
  JSON.stringify(
    getSpacemonkeyIdentityRegistry(),
    null,
    2
  )
)
