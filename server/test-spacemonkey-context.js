import {
  buildSpacemonkeyContext
}
from "./services/spacemonkey/index.js"


const context =
  buildSpacemonkeyContext()


console.log(
  JSON.stringify(
    context,
    null,
    2
  )
)
