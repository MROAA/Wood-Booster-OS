import { enrichReasoningResult } from "./server/services/aiBrainV2/services/moduleCapability/reasoningCapabilityBridge.js"

const fakeReasoningResult = {
  analysis: {
    intent: "test-intent",
    summary: "Tekoälyn testianalyysi"
  }
}

const testMessages = [
  "muista tämä asia",
  "jotain ihan muuta"
]

for (const msg of testMessages) {
  console.log("---")
  console.log("Viesti:", msg)

  const enriched = enrichReasoningResult({
    reasoningResult: fakeReasoningResult,
    message: msg
  })

  console.log(JSON.stringify(enriched, null, 2))
}
