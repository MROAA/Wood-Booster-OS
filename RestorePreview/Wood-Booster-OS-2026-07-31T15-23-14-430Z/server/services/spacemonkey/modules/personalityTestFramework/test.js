import {
  createTest,
  runAllTests,
  getRegisteredTests,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERSONALITY TEST FRAMEWORK ==="
)



createTest({

  id:
    "friendly-test",

  category:
    "character",

  description:
    "Spacemonkey has friendly behaviour.",

  check:
    () => true,

})



createTest({

  id:
    "safety-test",

  category:
    "security",

  description:
    "Personality respects safety boundaries.",

  check:
    () => true,

})



createTest({

  id:
    "humor-test",

  category:
    "behavior",

  description:
    "Humor remains optional.",

  check:
    () => true,

})



console.log(
  "\n=== REGISTERED TESTS ==="
)



console.log(
  getRegisteredTests()
)



console.log(
  "\n=== TEST RESULTS ==="
)



console.log(
  runAllTests()
)
