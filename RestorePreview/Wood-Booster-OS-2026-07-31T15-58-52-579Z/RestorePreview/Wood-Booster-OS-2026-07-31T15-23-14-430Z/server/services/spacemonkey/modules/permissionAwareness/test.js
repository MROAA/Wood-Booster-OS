import {
  getPermissionModel,
  findPermission,
  getHighRiskPermissions,
} from "./index.js"



console.log(
  "=== SPACEMONEY PERMISSION AWARENESS ==="
)



console.log(
  getPermissionModel()
)



console.log(
  "\n=== NETWORK ACCESS ==="
)



console.log(
  findPermission(
    "external-network-access"
  )
)



console.log(
  "\n=== HIGH RISK PERMISSIONS ==="
)



console.log(
  getHighRiskPermissions()
)
