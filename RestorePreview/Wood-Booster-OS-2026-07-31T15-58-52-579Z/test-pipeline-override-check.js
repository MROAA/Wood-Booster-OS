import { runBrainPipeline } from "./server/services/aiBrainV2/brainPipeline.js"

const result = await runBrainPipeline({
  message: "muista tämä asia",
  source: "test-override-check"
})

console.log("Success:", result.success)
console.log("Status:", result.status)
console.log("---")
console.log("RAW decision (stages.decision.output):")
console.log("  targetModule:", result.stages.decision?.output?.targetModule)
console.log("---")
console.log("Execution stage:")
console.log("  success:", result.stages.execution?.success)
console.log("  moduleId requested:", result.stages.execution?.moduleId)
console.log("  error:", JSON.stringify(result.stages.execution?.error, null, 2))
console.log("---")
console.log("Full error:")
console.log(JSON.stringify(result.error, null, 2))
