import {
  getSecretRegistry,
  findSecretPolicy,
  getCriticalSecrets,
} from "./index.js"



console.log(
  "=== SPACEMONEY SECRET PROTECTION REGISTRY ==="
)



console.log(
  getSecretRegistry()
)



console.log(
  "\n=== PRIMARY POLICY ==="
)



console.log(
  findSecretPolicy(
    "protected-term-primary"
  )
)



console.log(
  "\n=== CRITICAL PROTECTION ==="
)



console.log(
  getCriticalSecrets()
)
