/*
=====================================
WOOD-BOOSTER AI BRAIN V2

DEFAULT MODULE REGISTRATION

Tämä tiedosto rekisteröi kaikki
AI Brain V2:n oletusmoduulit.

Uudet moduulit lisätään vain tähän.
=====================================
*/


import {
  hasBrainModule,
  registerBrainModule,
} from "./moduleRegistry.js"

import {
  createDecisionModule,
} from "./modules/decisionModule.js"

import {
  createReasoningModule,
} from "./modules/reasoningModule.js"

import {
  createActionModule,
} from "./modules/actionModule.js"

import {
  createMemoryModule,
} from "./modules/memoryModule.js"

import {
  createKnowledgeModule,
} from "./modules/knowledgeModule.js"

import {
  createConversationModule,
} from "./modules/conversationModule.js"

import {
  createSpacemonkeyModule,
} from "./modules/spacemonkeyModule.js"


function registerModuleIfMissing(
  moduleDefinition,
) {
  if (
    hasBrainModule(
      moduleDefinition.id,
    )
  ) {
    return false
  }

  registerBrainModule(
    moduleDefinition,
  )

  return true
}


function registerDefaultBrainModules() {
  const registeredModules = []

  const defaultModules = [
    createSpacemonkeyModule(),
    createDecisionModule(),
    createReasoningModule(),
    createActionModule(),
    createMemoryModule(),
    createKnowledgeModule(),
    createConversationModule(),
  ]

  for (
    const moduleDefinition
    of defaultModules
  ) {
    if (
      registerModuleIfMissing(
        moduleDefinition,
      )
    ) {
      registeredModules.push(
        moduleDefinition.id,
      )
    }
  }

  return {
    initialized:
      true,

    registeredModules,
  }
}


export {
  registerDefaultBrainModules,
}
