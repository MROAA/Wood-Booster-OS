import { runBrainPipeline } from "./server/services/aiBrainV2/brainPipeline.js"

const result = await runBrainPipeline({
  message: "muista tämä asia",
  source: "test-vaihe3"
})

console.log("Success:", result.success)
console.log("Status:", result.status)
console.log("---")
console.log("Reasoning stage success:", result.stages.reasoning?.success)
console.log("---")
console.log("Decision runtimeContext capabilityContext:")
console.log(JSON.stringify(result.stages.decision?.output, null, 2))
console.log("---")
console.log("Final output:")
console.log(JSON.stringify(result.finalOutput, null, 2))
