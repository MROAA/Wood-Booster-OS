/*
==================================================

SPACEMONKEY IMPULSE SCHEDULER

Vastuut:

- herättää Spacemonkeyn itsenäisesti säännöllisin väliajoin
- tuottaa yhden autonomisen impulssin (ei kukaan pyydä sitä)
- tallentaa tuloksen activity-historiaan

Ei:
- suorita työkaluja
- muokkaa koodia
- tee git-operaatioita

Rakenne on sama kuin gitSyncWatcher.js:ssä: yksi setInterval,
uudelleenkäynnistyssuoja, ei kaadu palvelinta virhetilanteessa.

==================================================
*/

import {
  generateSpacemonkeyImpulse,
  recordAutonomousImpulse,
} from "./spacemonkeyImpulseEngine.js"


const DEFAULT_INTERVAL =
  Number(process.env.SPACEMONKEY_IMPULSE_INTERVAL_MS) ||
  24 * 60 * 60 * 1000


let schedulerActive = false

let intervalId = null

let lastRun = null

let lastError = null


async function runImpulseCycle({ prisma }) {
  try {
    const result = await generateSpacemonkeyImpulse({ prisma })

    if (!result.success) {
      lastError = result.error
      console.error("Spacemonkey Impulse Scheduler: generation failed:", result.error)
      return
    }

    await recordAutonomousImpulse({
      prisma,
      topic: result.topic,
      impulse: result.impulse,
      groundedIn: result.groundedIn,
    })

    lastError = null
    lastRun = new Date().toISOString()

    console.log("Spacemonkey Impulse Scheduler: recorded a new autonomous impulse -", result.topic)
  }

  catch (error) {
    lastError = error.message
    console.error("Spacemonkey Impulse Scheduler error:", error)
  }
}


function startSpacemonkeyImpulseScheduler({ prisma, interval = DEFAULT_INTERVAL } = {}) {
  if (schedulerActive) {
    return {
      active: true,
      message: "Spacemonkey Impulse Scheduler already running",
    }
  }

  schedulerActive = true

  runImpulseCycle({ prisma })

  intervalId = setInterval(() => {
    runImpulseCycle({ prisma })
  }, interval)

  return {
    active: true,
    interval,
  }
}


function stopSpacemonkeyImpulseScheduler() {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }

  schedulerActive = false
}


function getSpacemonkeyImpulseSchedulerStatus() {
  return {
    active: schedulerActive,
    lastRun,
    lastError,
  }
}


export {
  startSpacemonkeyImpulseScheduler,
  stopSpacemonkeyImpulseScheduler,
  getSpacemonkeyImpulseSchedulerStatus,
}
