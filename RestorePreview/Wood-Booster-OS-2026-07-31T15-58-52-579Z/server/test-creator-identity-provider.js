import {
  loadCreatorIdentity,
  createCreatorIdentityContext,
} from "./services/llmSystem/providers/spacemonkey/creator/creatorIdentityProvider.js"



console.log("")

console.log(
  "🧬 CREATOR IDENTITY PROVIDER TEST"
)

console.log(
  "==============================="
)



const identity =
  await loadCreatorIdentity()



console.log("")

console.log(
  "IDENTITY STATUS"
)



console.log(
  JSON.stringify(
    {
      success:
        identity.success,

      type:
        identity.type,

      sourceCount:
        identity.sourceCount,

      pdfLoaded:
        identity.pdfLoaded,

    },
    null,
    2
  )
)



console.log("")

console.log(
  "SOURCES"
)



console.log(
  identity.sources.map(
    source =>
      source.source
  )
)



console.log("")

console.log(
  "CONTEXT PREVIEW"
)



console.log(
  createCreatorIdentityContext(identity)
    .slice(0,2000)
)



console.log("")

console.log(
  "✅ CREATOR IDENTITY TEST COMPLETE"
)
