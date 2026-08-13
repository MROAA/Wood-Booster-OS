import { applyCapabilityOverride } from "./server/services/aiBrainV2/services/moduleCapability/decisionOverrideBridge.js"

const test1 = applyCapabilityOverride({
  decisionOutput: { decision: "delegate", targetModule: "conversation", reason: "oletusvalinta", confidence: 0.9 },
  capabilityContext: { primaryModule: { moduleId: "memory-learning", moduleName: "Memory Learning Module", confidence: 10 } },
})
console.log("--- Testi 1: pitaisi ohittaa (conversation -> memory) ---")
console.log(JSON.stringify(test1, null, 2))

const test2 = applyCapabilityOverride({
  decisionOutput: { decision: "delegate", targetModule: "credentials", reason: "tasmallinen valinta", confidence: 0.9 },
  capabilityContext: { primaryModule: { moduleId: "memory-learning", moduleName: "Memory Learning Module", confidence: 10 } },
})
console.log("--- Testi 2: ei pitaisi ohittaa (decision valitsi jo credentials) ---")
console.log(JSON.stringify(test2, null, 2))

const test3 = applyCapabilityOverride({
  decisionOutput: { decision: "delegate", targetModule: "conversation", reason: "oletusvalinta", confidence: 0.9 },
  capabilityContext: { primaryModule: null },
})
console.log("--- Testi 3: ei pitaisi ohittaa (ei capability-osumaa) ---")
console.log(JSON.stringify(test3, null, 2))
