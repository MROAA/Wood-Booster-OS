import {
  validateModule,
  loadModule,
  getLoadedModules,
  clearLoadedModules,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY MODULE LOADER ==="
)



console.log(
  validateModule({

    id:
      "personality-humor",

    name:
      "Humor Personality Module",

    category:
      "behavior",

  })
)



console.log(
  "\n=== LOAD MODULE ==="
)



console.log(
  loadModule({

    id:
      "personality-humor",

    name:
      "Humor Personality Module",

    category:
      "behavior",

  })
)



console.log(
  "\n=== LOADED MODULES ==="
)



console.log(
  getLoadedModules()
)



console.log(
  "\n=== CLEAR TEST ==="
)



console.log(
  clearLoadedModules()
)
