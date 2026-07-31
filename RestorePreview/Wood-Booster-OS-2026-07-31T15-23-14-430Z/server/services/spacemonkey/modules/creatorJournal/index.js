const MODULE_ID = "creator-journal"



const entries = []



function createJournalEntry({

  event,

  thought,

  progress,

  lesson,

  futureDirection,

}){

  const entry = {

    id:
      `creator-journal-${Date.now()}`,

    timestamp:
      new Date().toISOString(),

    event,

    thought,

    progress,

    lesson,

    futureDirection,

    status:
      "stored",

  }


  entries.push(entry)


  return entry

}



function getJournal(){

  return {

    moduleId:
      MODULE_ID,

    timestamp:
      new Date().toISOString(),

    count:
      entries.length,

    entries,

  }

}



function getLatestEntries(){

  return entries.slice(-5)

}



function findEntry(id){

  return entries.find(
    entry =>
      entry.id === id
  ) || null

}



function getLessons(){

  return entries.map(
    entry => ({

      event:
        entry.event,

      lesson:
        entry.lesson,

    })
  )

}



export {

  MODULE_ID,

  createJournalEntry,

  getJournal,

  getLatestEntries,

  findEntry,

  getLessons,

}
