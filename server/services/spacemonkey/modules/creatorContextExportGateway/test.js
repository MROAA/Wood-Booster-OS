import {
  createExport,
  getExports,
  getExportTypes,
  getLatestExports,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR CONTEXT EXPORT GATEWAY ==="
)



console.log(
  getExportTypes()
)



console.log(
  "\n=== CREATE EXPORT ==="
)



console.log(
  createExport({

    requester:
      "agent-runtime",


    exportType:
      "agent-context",


    purpose:
      "Build operator reasoning context.",


    context:

      {

        principles:

          [
            "Build modular systems.",
            "Protect stable foundations.",
          ],

      },

  })
)



console.log(
  "\n=== EXPORT HISTORY ==="
)



console.log(
  getExports()
)



console.log(
  "\n=== LATEST EXPORTS ==="
)



console.log(
  getLatestExports()
)
