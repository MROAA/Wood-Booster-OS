import {
  createArchitectureReview,
  reviewSystem,
  getReviewAreas,
} from "./index.js"



console.log(
  "=== SPACEMONEY ARCHITECTURE REVIEW ==="
)



console.log(
  createArchitectureReview()
)



console.log(
  "\n=== REVIEW TEST ==="
)



console.log(
  reviewSystem(
    "Spacemonkey Operator System"
  )
)



console.log(
  "\n=== REVIEW AREAS ==="
)



console.log(
  getReviewAreas()
)
