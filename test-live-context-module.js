import {
  createLiveContextModule,
  getLastKnownFocus,
} from "./server/services/aiBrainV2/modules/liveContextModule.js"

const liveContextModule = createLiveContextModule()

const fakeRuntimeContext = {
  route: {
    routeId: "project-details",
    pageName: "Project Details",
    pageType: "project-details",
  },
  activeProject: {
    id: 42,
    name: "Aurora-jokipöytä",
  },
  activeCustomer: {},
  activeTab: {
    id: "materials",
    label: "Materials",
  },
  selectedItems: [],
  metadata: {
    missingMaterials: [
      { materialId: 1, name: "Tammilankku", unit: "kpl", shortage: 3 },
    ],
  },
}

const testMessages = [
  "missä projektissa olen nyt?",
  "jotain ihan muuta",
]

for (const message of testMessages) {
  console.log("---")
  console.log("Viesti:", message)

  const route = liveContextModule.canHandle({
    request: { message },
    runtimeContext: fakeRuntimeContext,
  })

  console.log("canHandle:", JSON.stringify(route, null, 2))

  if (route.matched) {
    const result = await liveContextModule.execute({
      request: { message, requestId: "test-request-live-context" },
      runtimeContext: fakeRuntimeContext,
    })

    console.log("execute:", JSON.stringify(result, null, 2))
  }
}

console.log("---")
console.log("getLastKnownFocus:", JSON.stringify(getLastKnownFocus(), null, 2))
