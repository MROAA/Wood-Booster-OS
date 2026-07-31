import {
  getSpacemonkeyIdentity,
} from "./services/spacemonkey/identity.js"


console.log(
  JSON.stringify(
    getSpacemonkeyIdentity(),
    null,
    2,
  ),
)
