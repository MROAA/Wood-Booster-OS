/**
 * Wood-Booster OS
 * Boosterverse SDK
 *
 * EventTypes
 *
 * Keskitetty tapahtumaluettelo.
 * Kaikki moduulit käyttävät näitä vakioita.
 */

export const EventTypes = Object.freeze({

  // ======================================================
  // Runtime
  // ======================================================

  RUNTIME_BOOT: "runtime.boot",
  RUNTIME_READY: "runtime.ready",
  RUNTIME_STOP: "runtime.stop",
  RUNTIME_ERROR: "runtime.error",

  // ======================================================
  // Modules
  // ======================================================

  MODULE_REGISTERED: "module.registered",
  MODULE_INITIALIZED: "module.initialized",
  MODULE_STARTED: "module.started",
  MODULE_STOPPED: "module.stopped",
  MODULE_ERROR: "module.error",

  // ======================================================
  // Context
  // ======================================================

  CONTEXT_UPDATED: "context.updated",
  CONTEXT_CHANGED: "context.changed",
  CONTEXT_CLEARED: "context.cleared",

  // ======================================================
  // Attention
  // ======================================================

  ATTENTION_CHANGED: "attention.changed",
  FOCUS_CHANGED: "focus.changed",
  INTENT_CHANGED: "intent.changed",

  // ======================================================
  // Memory
  // ======================================================

  MEMORY_CREATED: "memory.created",
  MEMORY_UPDATED: "memory.updated",
  MEMORY_DELETED: "memory.deleted",
  MEMORY_RECALLED: "memory.recalled",

  // ======================================================
  // Knowledge
  // ======================================================

  KNOWLEDGE_CREATED: "knowledge.created",
  KNOWLEDGE_UPDATED: "knowledge.updated",
  KNOWLEDGE_LINKED: "knowledge.linked",

  // ======================================================
  // Boosterverse
  // ======================================================

  WORLD_UPDATED: "world.updated",
  LORE_UPDATED: "lore.updated",
  ASSOCIATION_CREATED: "association.created",

  // ======================================================
  // Workflow
  // ======================================================

  WORKFLOW_STARTED: "workflow.started",
  WORKFLOW_COMPLETED: "workflow.completed",
  TASK_CREATED: "task.created",
  TASK_COMPLETED: "task.completed",

  // ======================================================
  // Opportunity
  // ======================================================

  OPPORTUNITY_FOUND: "opportunity.found",
  OPPORTUNITY_ACCEPTED: "opportunity.accepted",
  OPPORTUNITY_REJECTED: "opportunity.rejected",

  // ======================================================
  // Reflection
  // ======================================================

  REFLECTION_CREATED: "reflection.created",
  REFLECTION_FINISHED: "reflection.finished",

  // ======================================================
  // Evolution
  // ======================================================

  SKILL_IMPROVED: "skill.improved",
  EXPERIENCE_GAINED: "experience.gained",
  PERSONALITY_UPDATED: "personality.updated",

  // ======================================================
  // AI
  // ======================================================

  AI_REQUEST: "ai.request",
  AI_RESPONSE: "ai.response",
  AI_ERROR: "ai.error",

  // ======================================================
  // Media
  // ======================================================

  IMAGE_CREATED: "image.created",
  VIDEO_CREATED: "video.created",
  VIDEO_EDITED: "video.edited",

  // ======================================================
  // Business
  // ======================================================

  CUSTOMER_CREATED: "customer.created",
  PROJECT_CREATED: "project.created",
  PROJECT_UPDATED: "project.updated",
  PROJECT_COMPLETED: "project.completed",

  QUOTE_CREATED: "quote.created",
  QUOTE_ACCEPTED: "quote.accepted",

  // ======================================================
  // System
  // ======================================================

  HEALTH_WARNING: "health.warning",
  HEALTH_ERROR: "health.error"

})

export default EventTypes
