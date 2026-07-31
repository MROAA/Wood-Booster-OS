import {
  detectMemoryIntent,
} from "./services/aiBrainV2/engines/memoryIntentEngine.js"


const tests = [
  "Muista tämä: Spacemonkey syntyi 24.07.2026.",

  "Tallenna tämä muistiin: käyttäjä haluaa suomalaisen AI:n.",

  "Miten valmistetaan Aurora-jokipöytä?",
]


for (
  const test
  of tests
) {

  console.log(
    "\nTESTI:",
    test,
  )

  console.log(
    detectMemoryIntent(
      test,
    ),
  )
}
