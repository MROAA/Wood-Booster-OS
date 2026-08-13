import {
  initializeControlCenter,
  createControlReport,
  getControlStatus,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR INTELLIGENCE CONTROL CENTER ==="
)



console.log(
  initializeControlCenter({

    registry:
      true,


    health:
      true,


    diagnostics:
      true,


    runtime:
      true,

  })
)



console.log(
  "\n=== CONTROL REPORT ==="
)



console.log(
  createControlReport({

    registry:
      {
        modules:
          18,
      },


    health:
      {
        status:
          "healthy",

      },


    diagnostics:
      {
        status:
          "healthy",

      },


    runtime:
      {
        status:
          "active",

      },

  })
)



console.log(
  "\n=== STATUS ==="
)



console.log(
  getControlStatus()
)
