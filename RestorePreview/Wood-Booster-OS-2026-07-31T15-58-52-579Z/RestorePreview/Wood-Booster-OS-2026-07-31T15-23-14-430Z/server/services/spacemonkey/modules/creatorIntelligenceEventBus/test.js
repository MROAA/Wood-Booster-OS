import {
  subscribe,
  publish,
  getSubscribers,
  getEventHistory,
  getLatestEvents,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE EVENT BUS ==="
)



console.log(
  subscribe({

    event:
      "knowledge-updated",


    module:
      "creator-context-provider",


    handler:
      payload => ({

        received:
          payload,

      }),

  })
)



console.log(
  "\n=== SUBSCRIBERS ==="
)



console.log(
  getSubscribers()
)



console.log(
  "\n=== PUBLISH EVENT ==="
)



console.log(
  publish({

    event:
      "knowledge-updated",


    payload:

      {

        source:
          "creator-knowledge-vault",

        message:
          "New creator principle stored.",

      },

  })
)



console.log(
  "\n=== EVENT HISTORY ==="
)



console.log(
  getEventHistory()
)



console.log(
  "\n=== LATEST EVENTS ==="
)



console.log(
  getLatestEvents()
)
