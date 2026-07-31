import {
  getSystemContext,
  getIdentityContext,
  getMemoryContext,
  getKnowledgeContext,
  getSpacemonkeyContext,
  getContextSummary,
  hasContext,
} from "./services/aiBrainV2/services/runtimeContextAccess.js"





console.log("")

console.log(
  "🧠 RUNTIME CONTEXT ACCESS TEST"
)

console.log(
  "============================"
)





const runtimeContext = {

  systemContext: {

    platform:
      "Wood-Booster AI Platform",

    status:
      "READY"

  },


  identityContext: {

    name:
      "Spacemonkey",

    role:
      "Enterprise AI Operator"

  },


  memoryContext: {

    available:
      true,

    items:
      []

  },


  knowledgeContext: {

    available:
      true,

    sources:
      []

  },


  spacemonkey: {

    version:
      "1.0.0"

  }

}







console.log("")

console.log(
  "HAS CONTEXT"
)

console.log(
  hasContext(runtimeContext)
)







console.log("")

console.log(
  "SYSTEM"
)

console.log(
  JSON.stringify(
    getSystemContext(runtimeContext),
    null,
    2
  )
)







console.log("")

console.log(
  "IDENTITY"
)

console.log(
  JSON.stringify(
    getIdentityContext(runtimeContext),
    null,
    2
  )
)







console.log("")

console.log(
  "MEMORY"
)

console.log(
  JSON.stringify(
    getMemoryContext(runtimeContext),
    null,
    2
  )
)







console.log("")

console.log(
  "KNOWLEDGE"
)

console.log(
  JSON.stringify(
    getKnowledgeContext(runtimeContext),
    null,
    2
  )
)







console.log("")

console.log(
  "SPACEMONKEY"
)

console.log(
  JSON.stringify(
    getSpacemonkeyContext(runtimeContext),
    null,
    2
  )
)







console.log("")

console.log(
  "SUMMARY"
)

console.log(
  JSON.stringify(
    getContextSummary(runtimeContext),
    null,
    2
  )
)







console.log("")

console.log(
  "✅ RUNTIME CONTEXT ACCESS TEST COMPLETE"
)
