import {
  loadSpacemonkeyIdentity,
  createSpacemonkeyIdentityContext,
} from "./services/llmSystem/providers/spacemonkey/spacemonkeyIdentityProvider.js"



console.log("")

console.log(
  "🐒 SPACEMONKEY IDENTITY PROVIDER TEST"
)

console.log(
  "=================================="
)



const identity =
  await loadSpacemonkeyIdentity()



console.log("")

console.log(
  "STATUS"
)



console.log(
  JSON.stringify(
    {
      success:
        identity.success,

      type:
        identity.type,

      name:
        identity.name,

      role:
        identity.role,

      creatorLoaded:
        identity.creatorLoaded,

    },
    null,
    2
  )
)



console.log("")

console.log(
  "IDENTITY CONTEXT PREVIEW"
)



console.log(
  createSpacemonkeyIdentityContext(
    identity
  )
  .slice(0,2000)
)



console.log("")

console.log(
  "✅ SPACEMONKEY IDENTITY TEST COMPLETE"
)
