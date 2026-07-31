import {
  createJournalEntry,
  getJournal,
  getLatestEntries,
  findEntry,
  getLessons,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR JOURNAL ==="
)



const entry =
  createJournalEntry({

    event:
      "Spacemonkey modular architecture development.",


    thought:
      "Stable systems should grow through isolated modules.",


    progress:
      "Built Creator Layer foundations.",


    lesson:
      "Small safe steps create reliable systems.",


    futureDirection:
      "Connect knowledge layers carefully.",

  })



console.log(
  entry
)



console.log(
  "\n=== JOURNAL ==="
)



console.log(
  getJournal()
)



console.log(
  "\n=== FIND ENTRY ==="
)



console.log(
  findEntry(
    entry.id
  )
)



console.log(
  "\n=== LESSONS ==="
)



console.log(
  getLessons()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestEntries()
)
