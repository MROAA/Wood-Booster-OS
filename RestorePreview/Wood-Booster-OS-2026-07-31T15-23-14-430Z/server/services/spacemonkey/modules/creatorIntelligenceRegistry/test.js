import {
  getRegistry,
  findModule,
  getActiveModules,
  getDependencies,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE REGISTRY ==="
)



console.log(
  getRegistry()
)



console.log(
  "\n=== FIND RUNTIME ==="
)



console.log(
  findModule(
    "creator-context-runtime"
  )
)



console.log(
  "\n=== ACTIVE MODULES ==="
)



console.log(
  getActiveModules()
)



console.log(
  "\n=== DEPENDENCIES ==="
)



console.log(
  getDependencies(
    "creator-decision-memory"
  )
)
