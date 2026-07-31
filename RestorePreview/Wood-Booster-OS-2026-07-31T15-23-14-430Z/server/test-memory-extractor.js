import {
  extractMemory
} from "./services/memoryExtractor.js"



const result =
  await extractMemory({

    conversation: `

User:
Haluan että Wood-Boosterissa laatu on aina tärkeämpää kuin määrä.

User:
Puun tarina on yrityksen tärkein ajatus.

`

  })


console.log(result)