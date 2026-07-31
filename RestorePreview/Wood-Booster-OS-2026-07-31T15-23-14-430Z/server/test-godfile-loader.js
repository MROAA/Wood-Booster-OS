import {
  loadGodfiles,
  createGodfileContext
} from "./services/llmSystem/providers/spacemonkey/godfileLoader.js"



console.log("")

console.log(
  "🧬 GODFILE LOADER TEST"
)

console.log(
  "===================="
)



const godfiles =
  await loadGodfiles()



console.log(
  JSON.stringify(
    godfiles,
    null,
    2
  )
)



console.log("")

console.log(
  "CONTEXT"
)



console.log(
  createGodfileContext(
    godfiles
  )
)



console.log("")

console.log(
  "✅ GODFILE TEST COMPLETE"
)
