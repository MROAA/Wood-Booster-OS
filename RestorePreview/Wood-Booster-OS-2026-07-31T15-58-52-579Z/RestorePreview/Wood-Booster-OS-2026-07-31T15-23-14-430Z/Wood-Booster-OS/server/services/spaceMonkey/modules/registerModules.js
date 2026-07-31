import {
  registerModule,
} from "./moduleRegistry.js"

import {
  memoryModule,
} from "./memory/index.js"

import {
  knowledgeModule,
} from "./knowledge/index.js"

import {
  plannerModule,
} from "./planner/index.js"

import {
  decisionModule,
} from "./decision/index.js"

import {
  taskModule,
} from "./task/index.js"

import {
  executionModule,
} from "./execution/index.js"

import {
  workflowModule,
} from "./workflow/index.js"


let modulesRegistered = false


function registerSpaceMonkeyModules() {
  if (modulesRegistered) {
    return
  }

  registerModule(
    memoryModule,
  )

  registerModule(
    knowledgeModule,
  )

  registerModule(
    plannerModule,
  )

  registerModule(
    decisionModule,
  )

  registerModule(
    taskModule,
  )

  registerModule(
    executionModule,
  )

  registerModule(
    workflowModule,
  )

  modulesRegistered = true
}


export {
  registerSpaceMonkeyModules,
}
