import {
  filterSystemFiles
} from "./services/systemFilter.js"


const result =
  await filterSystemFiles(
    "Miten teen React komponentin?"
  )


console.log(
  result.map(
    file => file.name
  )
)