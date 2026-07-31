import { createDecisionCapabilityContext } from "./server/services/aiBrainV2/services/moduleCapability/decisionCapabilityContext.js"

const testMessages = [
  "muista tämä asia",
  "avaa yhteys",
  "jotain ihan muuta"
]

for (const msg of testMessages) {
  console.log("---")
  console.log("Viesti:", msg)

  const result = createDecisionCapabilityContext(msg)
  console.log(JSON.stringify(result, null, 2))
}
