import {
  createMemoryInjectionContext,
} from "./services/aiBrainV2/services/memoryInjectionAdapter.js"



const result =
  createMemoryInjectionContext({

    runtimeContext: {

      memoryItems: [
        {
          type:
            "memory",

          content:
            "Spacemonkey AI syntyi 24.07.2026.",
        },
      ],


      memoryContext:
        "Spacemonkey AI syntyi 24.07.2026.",

    },

  })


console.log(result)
