function initializeTaskModule() {
  return {
    success: true,
    status: "initialized",
    moduleId: "task",
  }
}


function startTaskModule() {
  return {
    success: true,
    status: "started",
    moduleId: "task",
  }
}


function getTaskModuleHealth() {
  return {
    success: true,
    status: "healthy",
    moduleId: "task",
  }
}


function createTasksFromPlan({
  plan,
} = {}) {
  if (
    !plan ||
    typeof plan !== "object"
  ) {
    return {
      success: false,
      status: "invalid-plan",
      moduleId: "task",
      tasks: [],
    }
  }

  if (
    !Array.isArray(plan.steps) ||
    plan.steps.length === 0
  ) {
    return {
      success: false,
      status: "empty-plan",
      moduleId: "task",
      tasks: [],
    }
  }

  const tasks =
    plan.steps.map(
      (step, index) => ({
        id: `task-${index + 1}`,
        order: index + 1,
        status: "pending",
        action:
          String(
            step?.action || "",
          ).trim(),
        sourceStepId:
          step?.id || null,
      }),
    )

  return {
    success: true,
    status: "tasks-created",
    moduleId: "task",
    goal:
      plan.goal || null,
    tasks,
  }
}


const taskModule = {
  id: "task",
  name: "Task Module",
  version: "1.0.0",
  description:
    "SpaceMonkeyn tehtävien hallintamoduuli.",
  enabled: true,
  initialize:
    initializeTaskModule,
  start:
    startTaskModule,
  health:
    getTaskModuleHealth,
  createTasksFromPlan,
}


export {
  taskModule,
}
