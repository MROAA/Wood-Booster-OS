import {
  loadCreatorPDF,
  createCreatorIdentityContext
} from "./services/llmSystem/providers/spacemonkey/creator/pdfIdentityLoader.js"



console.log("")

console.log(
  "📄 PDF IDENTITY LOADER TEST"
)

console.log(
  "=========================="
)



const document =
  await loadCreatorPDF()



console.log(
  JSON.stringify(
    document,
    null,
    2
  )
)



console.log("")

console.log(
  "IDENTITY CONTEXT"
)



console.log(
  createCreatorIdentityContext(
    document
  )
)



console.log("")

console.log(
  "✅ PDF IDENTITY TEST COMPLETE"
)
