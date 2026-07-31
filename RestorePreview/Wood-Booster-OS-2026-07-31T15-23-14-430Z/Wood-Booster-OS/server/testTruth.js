import {
  getTruthBundle
} from "./services/truthBundle.js"


console.log(
  JSON.stringify(
    getTruthBundle(
      "Miten valmistetaan Aurora-jokipöytä?"
    ),
    null,
    2
  )
)
