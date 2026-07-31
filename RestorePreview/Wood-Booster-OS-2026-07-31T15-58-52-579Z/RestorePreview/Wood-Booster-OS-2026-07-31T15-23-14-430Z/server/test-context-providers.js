/*
=====================================
WOOD-BOOSTER AI PLATFORM

CONTEXT PROVIDER TEST V4

Turvallinen testi:

- rekisteröi kaikki providerit
- luo Context Engine V2 kontekstin
- näyttää vain tilatiedot
- ei tulosta identiteetin sisältöä

=====================================
*/


import {
  registerDefaultContextProviders,
} from "./services/llmSystem/providers/registerProviders.js"


import {
  createBaseContext,
  getContextSummary,
} from "./services/llmSystem/core/contextEngine.js"







console.log("")

console.log(
  "🧠 CONTEXT PROVIDER TEST V4"
)

console.log(
  "=========================="
)







console.log("")

console.log(
  "REGISTER PROVIDERS"
)





const providers =
  registerDefaultContextProviders()



console.log(
  JSON.stringify(
    providers,
    null,
    2
  )
)







console.log("")

console.log(
  "CREATE CONTEXT"
)





const context =
  await createBaseContext({

    message:
      "Testaa Spacemonkey identiteetti",

    source:
      "context-provider-test"

  })








console.log("")

console.log(
  "SAFE CONTEXT SUMMARY"
)





console.log(
  JSON.stringify(

    {

      summary:
        getContextSummary(
          context
        ),



      providersLoaded:
        Object.keys(
          context
        ),



      system:
        Boolean(
          context.system
        ),



      identity:
        Boolean(
          context.identity
        ),



      memory:
        Boolean(
          context.memory
        ),



      knowledge:
        Boolean(
          context.knowledge
        ),



      finnishCulture:
        Boolean(
          context.finnishCulture
        ),



      spacemonkeyPersona:
        Boolean(
          context.spacemonkeyPersona
        ),



      creatorIdentity:
        Boolean(
          context.creator_identity
        ),

    },

    null,

    2

  )
)







console.log("")

console.log(
  "✅ SAFE CONTEXT PROVIDER TEST COMPLETE"
)
