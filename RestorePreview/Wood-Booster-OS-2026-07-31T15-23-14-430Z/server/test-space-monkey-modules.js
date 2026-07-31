import {
  getModules,
  getModuleIds,
} from "./services/spaceMonkey/modules/moduleRegistry.js"

import {
  registerSpaceMonkeyModules,
} from "./services/spaceMonkey/modules/registerModules.js"


registerSpaceMonkeyModules()


console.log(
  "\nSPACE MONKEY MODULES\n",
)

console.dir(
  getModules(),
  {
    depth: null,
  },
)


console.log(
  "\nMODULE IDS\n",
)

console.dir(
  getModuleIds(),
  {
    depth: null,
  },
)
