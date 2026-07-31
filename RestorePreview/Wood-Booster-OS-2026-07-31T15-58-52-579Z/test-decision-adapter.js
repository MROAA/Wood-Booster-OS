import { createDecisionModuleInput, getPrimaryDecisionModule } from "./server/services/aiBrainV2/services/moduleCapability/decisionModuleAdapter.js"

const testMessages = [
  "muista tämä asia",
  "avaa yhteys",
  "jotain ihan muuta"
]

for (const msg of testMessages) {
  console.log("---")
  console.log("Viesti:", msg)

  const input = createDecisionModuleInput(msg)
  console.log("Input:", JSON.stringify(input, null, 2))

  const primary = getPrimaryDecisionModule(msg)
  console.log("PrimaryModule:", JSON.stringify(primary, null, 2))
}
