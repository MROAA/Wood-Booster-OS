import { enrichDecisionRuntimeContext } from "./server/services/aiBrainV2/services/moduleCapability/decisionCapabilityBridge.js"

const fakeRuntimeContext = {
  requestId: "test-request-123",
  source: "test"
}

const testMessages = [
  "muista tämä asia",
  "jotain ihan muuta"
]

for (const msg of testMessages) {
  console.log("---")
  console.log("Viesti:", msg)

  const enriched = enrichDecisionRuntimeContext({
    message: msg,
    runtimeContext: fakeRuntimeContext
  })

  console.log(JSON.stringify(enriched, null, 2))
}
