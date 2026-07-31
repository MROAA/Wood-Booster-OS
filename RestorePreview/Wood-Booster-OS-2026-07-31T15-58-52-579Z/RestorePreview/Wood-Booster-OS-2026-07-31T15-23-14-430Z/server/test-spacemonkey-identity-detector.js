import {
  isIdentityQuestion
} from "./services/spacemonkey/identityQuestion.js"



console.log(
  "Kuka loi sinut?",
  isIdentityQuestion(
    "Kuka loi sinut?"
  )
)



console.log(
  "Aurora:",
  isIdentityQuestion(
    "Miten valmistetaan Aurora-jokipöytä?"
  )
)



console.log(
  "Kuka olet?",
  isIdentityQuestion(
    "Kuka olet?"
  )
)
