import {
  getPersonalityRegistry,
  findPersonalityModule,
  getModulesByCategory,
  getActiveModules,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY MODULE REGISTRY ==="
)



console.log(
  getPersonalityRegistry()
)



console.log(
  "\n=== HUMOR MODULE ==="
)



console.log(
  findPersonalityModule(
    "personality-humor"
  )
)



console.log(
  "\n=== MEMORY MODULES ==="
)



console.log(
  getModulesByCategory(
    "memory"
  )
)



console.log(
  "\n=== ACTIVE MODULES ==="
)



console.log(
  getActiveModules()
)
