import {
  buildGodfileIndex
} from "./index/godfileIndex.js"



const index =
  buildGodfileIndex()



console.log(
  "GODFILE INDEX"
)


console.log(
  "TOTAL:",
  index.length
)


console.dir(
  index.slice(0,10),
  {
    depth:null
  }
)
