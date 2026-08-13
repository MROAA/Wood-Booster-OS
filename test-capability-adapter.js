import { createCapabilityContext, getPrimaryCapability } from "./server/services/aiBrainV2/services/moduleCapability/moduleCapabilityAdapter.js"

const testMessages = [
  "muista tämä asia",
  "avaa yhteys",
  "jotain ihan muuta"
]

for (const msg of testMessages) {
  console.log("---")
  console.log("Viesti:", msg)

  const context = createCapabilityContext(msg)
  console.log("Context:", JSON.stringify(context, null, 2))

  const primary = getPrimaryCapability(msg)
  console.log("Primary:", JSON.stringify(primary, null, 2))
}
