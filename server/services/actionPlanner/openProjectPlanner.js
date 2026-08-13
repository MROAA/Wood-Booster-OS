import {
  createActionResult,
  createNoMatchResult,
  getActiveProject,
  includesPhrase,
  normalizeText,
} from "./plannerUtils.js"


const projectTabs = [
  {
    id:
      "ai",

    label:
      "AI Assistant",

    keywords: [
      "ai assistant",
      "ai-avustaja",
      "tekoäly",
      "projektin ai",
      "projektin chat",
    ],
  },

  {
    id:
      "tools",

    label:
      "Tools",

    keywords: [
      "tools",
      "tool",
      "työkalut",
      "työkaluihin",
      "projektityökalut",
    ],
  },

  {
    id:
      "memory",

    label:
      "Memory",

    keywords: [
      "memory",
      "muisti",
      "muistiin",
      "projektimuisti",
    ],
  },

  {
    id:
      "knowledge",

    label:
      "Knowledge",

    keywords: [
      "knowledge",
      "tietopankki",
      "projektitieto",
      "projektin tieto",
      "knowledgeen",
    ],
  },

  {
    id:
      "files",

    label:
      "Files",

    keywords: [
      "files",
      "file",
      "tiedostot",
      "tiedostoihin",
      "projektitiedostot",
    ],
  },

  {
    id:
      "gallery",

    label:
      "Gallery",

    keywords: [
      "gallery",
      "galleria",
      "kuvat",
      "kuviin",
      "projektikuvat",
    ],
  },

  {
    id:
      "timeline",

    label:
      "Timeline",

    keywords: [
      "timeline",
      "aikajana",
      "aikataulu",
      "aikatauluun",
    ],
  },

  {
    id:
      "quote",

    label:
      "Quote",

    keywords: [
      "quote",
      "tarjous",
      "tarjoukseen",
      "tarjoukseksi",
    ],
  },

  {
    id:
      "invoice",

    label:
      "Lasku",

    keywords: [
      "invoice",
      "lasku",
      "laskuun",
      "laskutukseen",
    ],
  },
]


const openKeywords = [
  "avaa",
  "näytä",
  "siirry",
  "mene",
  "vaihda",
  "open",
  "show",
  "go to",
]


function containsOpenIntent(
  normalizedMessage,
) {
  return openKeywords.some(
    (keyword) =>
      includesPhrase(
        normalizedMessage,
        keyword,
      ),
  )
}


function findRequestedProjectTab(
  message,
) {
  const normalizedMessage =
    normalizeText(message)

  if (!normalizedMessage) {
    return null
  }

  if (
    !containsOpenIntent(
      normalizedMessage,
    )
  ) {
    return null
  }

  return (
    projectTabs.find(
      (tab) =>
        tab.keywords.some(
          (keyword) =>
            includesPhrase(
              normalizedMessage,
              keyword,
            ),
        ),
    ) ||
    null
  )
}


function createOpenProjectTabAction({
  tab,
  project,
}) {
  return {
    type:
      "open_project_tab",

    label:
      `Avaa ${tab.label}`,

    tab:
      tab.id,

    projectId:
      project.id,

    payload: {
      tab:
        tab.id,

      projectId:
        project.id,
    },
  }
}


function openProjectPlanner({
  message,
  runtimeContext,
}) {
  const requestedTab =
    findRequestedProjectTab(
      message,
    )

  if (!requestedTab) {
    return createNoMatchResult(
      "open project planner did not match",
    )
  }

  const activeProject =
    getActiveProject(
      runtimeContext,
    )

  if (!activeProject) {
    return createActionResult({
      matched: false,

      actions: [],

      answer:
        "Projektin välilehteä ei voida avata, koska aktiivista projektia ei ole valittu.",

      reason:
        "active project missing",
    })
  }

  const action =
    createOpenProjectTabAction({
      tab:
        requestedTab,

      project:
        activeProject,
    })

  return createActionResult({
    matched: true,

    actions: [
      action,
    ],

    answer:
      `Avataan projektin ${requestedTab.label}-välilehti.`,

    reason:
      "project tab action generated",
  })
}


function getSupportedProjectTabs() {
  return projectTabs.map(
    (tab) => ({
      id:
        tab.id,

      label:
        tab.label,
    }),
  )
}


export {
  createOpenProjectTabAction,
  findRequestedProjectTab,
  getSupportedProjectTabs,
  openProjectPlanner,
}
