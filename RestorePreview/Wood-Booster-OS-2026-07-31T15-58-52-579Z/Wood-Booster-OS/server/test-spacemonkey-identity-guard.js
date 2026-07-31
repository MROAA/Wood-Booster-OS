import {
  protectIdentityResponse
} from "./services/spacemonkey/identityGuard.js"



console.log(

  protectIdentityResponse(
    "Minut loi Marc Järvinen."
  )

)



console.log(

  protectIdentityResponse(
    null
  )

)
