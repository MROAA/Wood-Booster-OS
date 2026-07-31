import {
  clearBrainModules,
  getBrainModuleInfo,
  registerBrainModule,
  runBrain,
} from "./services/aiBrainV2/index.js"


function createActionModule() {
  return {
    id:
      "action",

    name:
      "Action Module",

    version:
      "1.0.0",

    description:
      "Käsittelee järjestelmän toimintopyynnöt.",

    priority:
      10,

    canHandle({
      request,
    }) {
      const text =
        String(
          request?.message ||
          "",
        ).toLowerCase()

      const matched =
        text.includes("avaa") ||
        text.includes("luo projekti")

      return {
        matched,

        confidence:
          matched
            ? 0.95
            : 0,

        reason:
          matched
            ? "Viesti sisältää toimintokomennon."
            : "Viesti ei sisällä toimintokomentoa.",
      }
    },

    async execute({
      message,
      request,
      runtimeContext,
    }) {
      return {
        type:
          "action_result",

        answer:
          `Action Module käsitteli viestin: ${message}`,

        action: {
          type:
            "navigation",

          target:
            "/projects",
        },

        requestId:
          request.requestId,

        source:
          runtimeContext.source,
      }
    },
  }
}


function createConversationModule() {
  return {
    id:
      "conversation",

    name:
      "Conversation Module",

    version:
      "1.0.0",

    description:
      "Käsittelee tavallisen keskustelun.",

    priority:
      100,

    canHandle() {
      return {
        matched:
          true,

        confidence:
          0.25,

        reason:
          "Conversation Module toimii varamoduulina.",
      }
    },

    async execute({
      message,
      request,
    }) {
      return {
        type:
          "conversation_result",

        answer:
          `Conversation Module käsitteli viestin: ${message}`,

        requestId:
          request.requestId,
      }
    },
  }
}


async function runTest() {
  clearBrainModules()

  registerBrainModule(
    createActionModule(),
  )

  registerBrainModule(
    createConversationModule(),
  )

  console.log(
    "\nREGISTERED MODULES\n",
  )

  console.dir(
    getBrainModuleInfo(),
    {
      depth:
        null,
    },
  )

  const actionResult =
    await runBrain({
      message:
        "Avaa projektit",

      source:
        "runtime-test",
    })

  console.log(
    "\nACTION RESULT\n",
  )

  console.dir(
    actionResult,
    {
      depth:
        null,
    },
  )

  const conversationResult =
    await runBrain({
      message:
        "Miten päiväsi on mennyt?",
    })

  console.log(
    "\nCONVERSATION RESULT\n",
  )

  console.dir(
    conversationResult,
    {
      depth:
        null,
    },
  )

  const emptyMessageResult =
    await runBrain({
      message:
        "   ",
    })

  console.log(
    "\nEMPTY MESSAGE RESULT\n",
  )

  console.dir(
    emptyMessageResult,
    {
      depth:
        null,
    },
  )

  const actionPassed =
    actionResult.success ===
      true &&
    actionResult.status ===
      "completed" &&
    actionResult.module?.id ===
      "action" &&
    actionResult.output?.action
      ?.target ===
      "/projects"

  const conversationPassed =
    conversationResult.success ===
      true &&
    conversationResult.status ===
      "completed" &&
    conversationResult.module?.id ===
      "conversation"

  const validationPassed =
    emptyMessageResult.success ===
      false &&
    emptyMessageResult.status ===
      "invalid_request"

  if (
    !actionPassed ||
    !conversationPassed ||
    !validationPassed
  ) {
    throw new Error(
      "AI Brain v2 Runtime -testi epäonnistui.",
    )
  }

  console.log(
    "\n✅ AI Brain v2 Runtime -testi onnistui.\n",
  )
}


runTest().catch(
  (error) => {
    console.error(
      "\n❌ AI Brain v2 Runtime -testi epäonnistui:",
      error,
    )

    process.exitCode =
      1
  },
)
