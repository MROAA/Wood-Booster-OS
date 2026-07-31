import {
  getSystemInventory,
  findModule,
  getModulesByCategory,
} from "./index.js"



console.log(
  "=== SPACEMONEY SYSTEM INVENTORY ==="
)



console.log(
  getSystemInventory()
)



console.log(
  "\n=== MEMORY MODULE ==="
)



console.log(
  findModule(
    "memory-intelligence"
  )
)



console.log(
  "\n=== OPERATOR MODULES ==="
)



console.log(
  getModulesByCategory(
    "operator"
  )
)
