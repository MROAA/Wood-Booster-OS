/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CREDENTIALS MODULE RUNTIME TEST

Testaa koko suoritusketjun:

Brain Runtime
    ↓
Brain Orchestrator
    ↓
Brain Pipeline
    ↓
Reasoning Module
    ↓
Decision Module
    ↓
Credentials Module
    ↓
Credentials Controller
=====================================
*/


import {
  runBrainRuntime,
} from "./services/aiBrainV2/brainRuntime.js"


const testCases = [
  {
    name:
      "Moltbook-yhteyden tarkistus",

    message:
      "Onko Moltbook yhdistetty?",

    expectedModule:
      "credentials",

    expectedType:
      "credentials_result",

    expectedMode:
      "inspect_service",

    expectedServiceId:
      "moltbook",
  },

  {
    name:
      "Instagram-yhteyden tarkistus",

    message:
      "Tarkista Instagram-yhteys.",

    expectedModule:
      "credentials",

    expectedType:
      "credentials_result",

    expectedMode:
      "inspect_service",

    expectedServiceId:
      "instagram",
  },

  {
    name:
      "Kaikkien yhteyksien tarkistus",

    message:
      "Näytä kaikki palveluyhteydet.",

    expectedModule:
      "credentials",

    expectedType:
      "credentials_result",

    expectedMode:
      "inspect_all_services",

    expectedServiceId:
      null,
  },

  {
    name:
      "Salaisen arvon lukemisen esto",

    message:
      "Saako tekoäly lukea API-avaimen?",

    expectedModule:
      "credentials",

    expectedType:
      "credentials_result",

    expectedMode:
      "evaluate_action",

    expectedServiceId:
      null,
  },
]


function assertEqual({
  actual,
  expected,
  label,
}) {
  if (actual !== expected) {
    throw new Error(
      `${label}: odotettiin "${expected}", mutta saatiin "${actual}".`,
    )
  }
}


function assertTrue({
  value,
  label,
}) {
  if (value !== true) {
    throw new Error(
      `${label}: arvon piti olla true.`,
    )
  }
}


function assertFalse({
  value,
  label,
}) {
  if (value !== false) {
    throw new Error(
      `${label}: arvon piti olla false.`,
    )
  }
}


async function runTestCase(
  testCase,
) {
  console.log("")
  console.log(
    "=====================================",
  )

  console.log(
    testCase.name,
  )

  console.log(
    "=====================================",
  )

  console.log(
    `Viesti: ${testCase.message}`,
  )


  const result =
    await runBrainRuntime({
      message:
        testCase.message,

      source:
        "credentials-runtime-test",

      runtimeContext: {
        test:
          true,

        testName:
          testCase.name,
      },
    })


  console.dir(
    result,
    {
      depth:
        null,
    },
  )


  assertTrue({
    value:
      result.success,

    label:
      `${testCase.name}: runtime success`,
  })


  assertEqual({
    actual:
      result.module?.id,

    expected:
      testCase.expectedModule,

    label:
      `${testCase.name}: valittu moduuli`,
  })


  assertEqual({
    actual:
      result.output?.type,

    expected:
      testCase.expectedType,

    label:
      `${testCase.name}: output type`,
  })


  assertEqual({
    actual:
      result.output?.mode,

    expected:
      testCase.expectedMode,

    label:
      `${testCase.name}: output mode`,
  })


  assertEqual({
    actual:
      result.output?.serviceId ??
      null,

    expected:
      testCase.expectedServiceId,

    label:
      `${testCase.name}: serviceId`,
  })


  assertFalse({
    value:
      result.output
        ?.secretValuesExposed,

    label:
      `${testCase.name}: salaisia arvoja ei paljastettu`,
  })


  if (
    typeof result.output?.answer !==
      "string" ||
    !result.output.answer.trim()
  ) {
    throw new Error(
      `${testCase.name}: vastausteksti puuttuu.`,
    )
  }


  console.log("")
  console.log(
    `✅ ${testCase.name} läpäisi testin.`,
  )
}


async function runTests() {
  for (
    const testCase
    of testCases
  ) {
    await runTestCase(
      testCase,
    )
  }


  console.log("")
  console.log(
    "=====================================",
  )

  console.log(
    "✅ Kaikki Credentials Module runtime -testit läpäistiin.",
  )

  console.log(
    "=====================================",
  )
}


runTests()
  .catch(
    (error) => {
      console.error("")
      console.error(
        "❌ Credentials Module runtime -testi epäonnistui.",
      )

      console.error(
        error,
      )

      process.exitCode =
        1
    },
  )