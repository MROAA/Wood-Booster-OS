/**
 * Wood-Booster OS
 * Permission Manager
 *
 * Hallitsee mitä Spacemonkey saa tehdä.
 */

class PermissionManager {

  constructor() {

    this.permissions = new Map()
  }

  register(permission) {

    this.permissions.set(
      permission.id,
      {
        enabled: true,
        approvalRequired: false,
        ...permission,
      }
    )

    return true
  }

  get(id) {

    return this.permissions.get(id)
  }

  has(id) {

    return this.permissions.has(id)
  }

  canExecute(id) {

    const permission =
      this.permissions.get(id)

    if (!permission) {

      return {
        allowed: false,
        reason: "Permission not found",
      }
    }

    if (!permission.enabled) {

      return {
        allowed: false,
        reason: "Permission disabled",
      }
    }

    return {
      allowed: true,
      approvalRequired:
        permission.approvalRequired,
    }
  }

  enable(id) {

    const permission =
      this.permissions.get(id)

    if (!permission) {
      return false
    }

    permission.enabled = true

    return true
  }

  disable(id) {

    const permission =
      this.permissions.get(id)

    if (!permission) {
      return false
    }

    permission.enabled = false

    return true
  }

  list() {

    return [
      ...this.permissions.values(),
    ]
  }

  summary() {

    return {

      total:
        this.permissions.size,

      enabled:
        this.list().filter(
          permission =>
            permission.enabled
        ).length,

      approvalRequired:
        this.list().filter(
          permission =>
            permission.approvalRequired
        ).length,
    }
  }
}

export default PermissionManager
