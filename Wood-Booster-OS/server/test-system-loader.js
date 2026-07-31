import {
  getSystemContext
} from "./services/systemLoader.js"


const context =
  await getSystemContext()


console.log(
  context.substring(0,3000)
)