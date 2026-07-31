import {
  getDependencyMap,
  getModuleDependencies,
  getStartupOrder,
} from "./index.js"



console.log(
  "=== MODULE DEPENDENCY MAP ==="
)



console.log(
  getDependencyMap()
)



console.log(
  "\n=== MEMORY DEPENDENCIES ==="
)



console.log(
  getModuleDependencies(
    "memory-intelligence"
  )
)



console.log(
  "\n=== STARTUP ORDER ==="
)



console.log(
  getStartupOrder()
)
