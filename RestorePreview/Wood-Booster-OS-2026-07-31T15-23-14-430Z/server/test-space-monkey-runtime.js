import {
  startRuntime,
} from "./services/spaceMonkey/runtime/runtime.js"


const result =
  startRuntime({
    modules: [
      "memory",
      "knowledge",
    ],
  })


console.log(
  "\nSPACE MONKEY RUNTIME\n",
)

console.dir(
  result,
  {
    depth: null,
  },
)
