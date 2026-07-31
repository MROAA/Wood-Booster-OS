function initializeDecisionModule() {
  return {
    success: true,
    status: "initialized",
    moduleId: "decision",
  }
}


function startDecisionModule() {
  return {
    success: true,
    status: "started",
    moduleId: "decision",
  }
}


function getDecisionModuleHealth() {
  return {
    success: true,
    status: "healthy",
    moduleId: "decision",
  }
}


function chooseModule({
  goal,
} = {}) {
  const normalizedGoal =
    String(goal || "")
      .trim()
      .toLowerCase()

  if (!normalizedGoal) {
    return {
      success: false,
      status: "invalid-goal",
      moduleId: "decision",
      selectedModuleId: null,
      reason: "Goal is required.",
    }
  }

  const memoryKeywords = [
    "memory",
    "remember",
    "muisti",
    "muista",
    "tallenna tieto",
  ]

  const knowledgeKeywords = [
    "knowledge",
    "information",
    "tieto",
    "tietopankki",
    "etsi tieto",
  ]

  const taskKeywords = [
    "task",
    "tasks",
    "tehtävä",
    "tehtävät",
    "luo tehtävät",
    "create tasks",
  ]

  const requiresMemory =
    memoryKeywords.some(
      (keyword) =>
        normalizedGoal.includes(
          keyword,
        ),
    )

  if (requiresMemory) {
    return {
      success: true,
      status: "decision-made",
      moduleId: "decision",
      selectedModuleId: "memory",
      reason:
        "The goal requires memory.",
    }
  }

  const requiresKnowledge =
    knowledgeKeywords.some(
      (keyword) =>
        normalizedGoal.includes(
          keyword,
        ),
    )

  if (requiresKnowledge) {
    return {
      success: true,
      status: "decision-made",
      moduleId: "decision",
      selectedModuleId: "knowledge",
      reason:
        "The goal requires knowledge.",
    }
  }

  const requiresTaskModule =
    taskKeywords.some(
      (keyword) =>
        normalizedGoal.includes(
          keyword,
        ),
    )

  if (requiresTaskModule) {
    return {
      success: true,
      status: "decision-made",
      moduleId: "decision",
      selectedModuleId: "task",
      reason:
        "The goal requires task management.",
    }
  }

  return {
    success: true,
    status: "decision-made",
    moduleId: "decision",
    selectedModuleId: "planner",
    reason:
      "The goal requires further planning.",
  }
}


const decisionModule = {
  id: "decision",
  name: "Decision Module",
  version: "1.0.0",
  description:
    "SpaceMonkeyn päätöksentekomoduuli.",
  enabled: true,
  initialize:
    initializeDecisionModule,
  start:
    startDecisionModule,
  health:
    getDecisionModuleHealth,
  chooseModule,
}


export {
  decisionModule,
}
