import {
  startSpaceMonkey,
} from "./services/spaceMonkey/index.js"


const result =
  startSpaceMonkey({
    modules: [
      "memory",
      "knowledge",
    ],
  })


console.log(
  "\nSPACE MONKEY\n",
)

console.dir(
  result,
  {
    depth: null,
  },
)
