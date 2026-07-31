const STORAGE_KEY = "woodBoosterWorkflow"

export function getWorkflow(projectId) {
  const workflows = getAllWorkflows()

  return (
    workflows[projectId] || [
      createStep("Suunnittelu"),
      createStep("Puun valinta"),
      createStep("Liimaus"),
      createStep("Jyrsintä"),
      createStep("Epoksi"),
      createStep("Hionta"),
      createStep("Pintakäsittely"),
      createStep("Toimitus"),
    ]
  )
}

export function saveWorkflow(
  projectId,
  workflow,
) {
  const workflows = getAllWorkflows()

  workflows[projectId] = workflow

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(workflows),
  )
}

export function getProgress(workflow) {
  if (!workflow.length) {
    return 0
  }

  const completed = workflow.filter(
    (step) => step.done,
  ).length

  return Math.round(
    (completed / workflow.length) * 100,
  )
}

function getAllWorkflows() {
  try {
    const saved = localStorage.getItem(
      STORAGE_KEY,
    )

    return saved ? JSON.parse(saved) : {}
  } catch {
    return {}
  }
}

function createStep(title) {
  return {
    id: crypto.randomUUID(),
    title,
    done: false,
  }
}