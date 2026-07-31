import {
  analyzeMemoryLearning,
} from "./services/aiBrainV2/modules/memoryLearningModule.js"


const tests = [
  "Muista tämä: Spacemonkey syntyi 24.07.2026.",
  "Miten valmistetaan Aurora-jokipöytä?",
]


for (
 const test
 of tests
){

console.log(
 "\nTESTI:",
 test,
)

console.log(
 analyzeMemoryLearning(test),
)

}
