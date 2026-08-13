import {
  runDiagnostics,
  getDiagnostics,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE DIAGNOSTICS ==="
)



console.log(
  runDiagnostics({

    modules:
      true,


    dependencies:
      true,


    context:
      true,


    security:
      true,


    evolution:
      true,

  })
)



console.log(
  "\n=== STORED DIAGNOSTICS ==="
)



console.log(
  getDiagnostics()
)
