import {
  checkPermission,
  getPermissions,
  getPermissionEvents,
} from "./index.js"



console.log(
  "=== SPACEMONEY CREATOR CONTEXT PERMISSION ENGINE ==="
)



console.log(
  getPermissions()
)



console.log(
  "\n=== APPROVED REQUEST ==="
)



console.log(
  checkPermission({

    requester:
      "personality-runtime",

    requestedData:

      [
        "creator-philosophy",
        "development-principles",
      ],

  })
)



console.log(
  "\n=== DENIED REQUEST ==="
)



console.log(
  checkPermission({

    requester:
      "unknown-module",

    requestedData:

      [
        "creator-philosophy",
      ],

  })
)



console.log(
  "\n=== PERMISSION EVENTS ==="
)



console.log(
  getPermissionEvents()
)
