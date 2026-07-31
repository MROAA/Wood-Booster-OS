import {
  createCodeReviewFramework,
  reviewCode,
  getReviewCriteria,
} from "./index.js"



console.log(
  "=== SPACEMONEY CODE REVIEW INTELLIGENCE ==="
)



console.log(
  createCodeReviewFramework()
)



console.log(
  "\n=== CODE REVIEW TEST ==="
)



console.log(
  reviewCode(
    "spacemonkeyCognitivePipeline.js"
  )
)



console.log(
  "\n=== REVIEW CRITERIA ==="
)



console.log(
  getReviewCriteria()
)
