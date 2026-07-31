import {
  emit,
  getEventHistory,
} from "./spacemonkeyEventBus.js"


console.log(
  "EVENT BUS TEST START"
)


const event =
  emit(
    "SYSTEM_TEST",
    {
      source:
        "Spacemonkey",

      message:
        "Event bus online",
    },
  )


console.log(
  event
)


console.log(
  getEventHistory()
)


console.log(
  "EVENT BUS TEST COMPLETE"
)
