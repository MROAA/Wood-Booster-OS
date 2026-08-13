import { resolveModuleCapabilities } from "./server/services/aiBrainV2/services/moduleCapability/moduleCapabilityResolver.js"

const testMessages = [
  "muista tämä asia",
  "avaa yhteys",
  "analysoi tilanne",
  "jotain ihan muuta"
]

for (const msg of testMessages) {
  const result = resolveModuleCapabilities(msg)
  console.log("---")
  console.log("Viesti:", msg)
  console.log("Success:", result.success)
  console.log("Matches:", JSON.stringify(result.matches, null, 2))
}
