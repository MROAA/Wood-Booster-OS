import {
  createSchedule,
  executeSchedule,
  getSchedules,
  getExecutionHistory,
  getLatestExecutions,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE SCHEDULER ==="
)



const healthSchedule =
  createSchedule({

    name:
      "Creator Health Check",


    interval:
      "daily",


    action:
      "run-health-monitor",

  })



const memorySchedule =
  createSchedule({

    name:
      "Creator Memory Review",


    interval:
      "weekly",


    action:
      "review-creator-memory",

  })



console.log(
  "\n=== SCHEDULES ==="
)



console.log(
  getSchedules()
)



console.log(
  "\n=== EXECUTE ==="
)



console.log(
  executeSchedule(
    healthSchedule.id
  )
)



console.log(
  executeSchedule(
    memorySchedule.id
  )
)



console.log(
  "\n=== EXECUTION HISTORY ==="
)



console.log(
  getExecutionHistory()
)



console.log(
  "\n=== LATEST ==="
)



console.log(
  getLatestExecutions()
)
