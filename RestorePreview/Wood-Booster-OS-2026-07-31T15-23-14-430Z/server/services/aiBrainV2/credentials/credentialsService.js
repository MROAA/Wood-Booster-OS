/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CREDENTIALS SERVICE V1

Vastuut:
- yhdistää Permission Layerin ja Credentials Registryn
- tarkistaa oikeuden ennen credentials-toimintoa
- palauttaa palvelun turvallisen yhteystilan
- estää rekisteröimättömät credentials-toiminnot
- estää salaisuuksien raaka-arvojen palauttamisen
- tarjoaa yhden rajapinnan tuleville moduuleille

Credentials Service ei:
- muodosta verkkoyhteyttä
- suorita OAuth-kirjautumista
- uusi tokeneita
- kirjoita ympäristömuuttujia
- palauta salaisuuksien raaka-arvoja
- julkaise sisältöä
=====================================
*/


import {
  evaluateCapabilityPermission,
} from "../system/capabilityPermissionLayer.js"

import {
  CONNECTION_STATUS,
  getCredentialsRegistrySummary,
  inspectAllCredentialServices,
  inspectCredentialService,
} from "./credentialsRegistry.js"


const CREDENTIALS_SERVICE_VERSION =
  "1.0.0"


const CREDENTIAL_ACTIONS =
  Object.freeze({
    CHECK_CONNECTION:
      "check_connection",

    CHECK_TOKEN_STATUS:
      "check_token_status",

    REFRESH_TOKEN:
      "refresh_token",

    CREATE_LOGIN_LINK:
      "create_login_link",

    COMPLETE_OAUTH_LOGIN:
      "complete_oauth_login",

    READ_SECRET_VALUE:
      "read_secret_value",

    EXPOSE_SECRET_IN_CHAT:
      "expose_secret_in_chat",
  })


function createCredentialsServiceError({
  actionId,
  serviceId = null,
  reason,
  permission = null,
}) {
  return {
    success:
      false,

    serviceId,

    actionId,

    reason,

    permission,

    credentialStatus:
      null,

    secretValuesExposed:
      false,
  }
}


function checkCredentialsPermission({
  actionId,
  approved = false,
  humanLoginCompleted = false,
}) {
  return evaluateCapabilityPermission({
    capabilityId:
      "credentials",

    actionId,

    approved,

    humanLoginCompleted,
  })
}


function inspectServiceConnection({
  serviceId,
  environment = process.env,
  runtimeState = {},
} = {}) {
  const actionId =
    CREDENTIAL_ACTIONS
      .CHECK_CONNECTION

  const permission =
    checkCredentialsPermission({
      actionId,
    })

  if (!permission.allowed) {
    return createCredentialsServiceError({
      actionId,
      serviceId,
      reason:
        permission.reason,
      permission,
    })
  }

  if (!permission.executable) {
    return createCredentialsServiceError({
      actionId,
      serviceId,
      reason:
        permission.reason,
      permission,
    })
  }

  const credentialStatus =
    inspectCredentialService({
      serviceId,
      environment,
      runtimeState,
    })

  if (!credentialStatus.success) {
    return createCredentialsServiceError({
      actionId,
      serviceId:
        credentialStatus.serviceId,
      reason:
        credentialStatus.reason,
      permission,
    })
  }

  return {
    success:
      true,

    serviceId:
      credentialStatus.serviceId,

    actionId,

    reason:
      "Palvelun credentials-tila tarkistettiin turvallisesti.",

    permission,

    credentialStatus,

    secretValuesExposed:
      false,
  }
}


function inspectAllServiceConnections({
  environment = process.env,
  runtimeStates = {},
} = {}) {
  const actionId =
    CREDENTIAL_ACTIONS
      .CHECK_CONNECTION

  const permission =
    checkCredentialsPermission({
      actionId,
    })

  if (!permission.allowed) {
    return createCredentialsServiceError({
      actionId,
      reason:
        permission.reason,
      permission,
    })
  }

  if (!permission.executable) {
    return createCredentialsServiceError({
      actionId,
      reason:
        permission.reason,
      permission,
    })
  }

  const services =
    inspectAllCredentialServices({
      environment,
      runtimeStates,
    })

  const connectedCount =
    services.filter(
      (service) =>
        service.status ===
        CONNECTION_STATUS.CONNECTED,
    ).length

  const configuredCount =
    services.filter(
      (service) =>
        service.configured,
    ).length

  const notConfiguredCount =
    services.filter(
      (service) =>
        service.status ===
        CONNECTION_STATUS
          .NOT_CONFIGURED,
    ).length

  const partiallyConfiguredCount =
    services.filter(
      (service) =>
        service.status ===
        CONNECTION_STATUS
          .PARTIALLY_CONFIGURED,
    ).length

  const loginRequiredCount =
    services.filter(
      (service) =>
        service.status ===
        CONNECTION_STATUS
          .LOGIN_REQUIRED,
    ).length

  return {
    success:
      true,

    actionId,

    reason:
      "Kaikkien rekisteröityjen palveluiden credentials-tila tarkistettiin.",

    permission,

    summary: {
      serviceCount:
        services.length,

      connectedCount,

      configuredCount,

      notConfiguredCount,

      partiallyConfiguredCount,

      loginRequiredCount,
    },

    services,

    secretValuesExposed:
      false,
  }
}


function inspectTokenStatus({
  serviceId,
  environment = process.env,
  runtimeState = {},
} = {}) {
  const actionId =
    CREDENTIAL_ACTIONS
      .CHECK_TOKEN_STATUS

  const permission =
    checkCredentialsPermission({
      actionId,
    })

  if (!permission.allowed) {
    return createCredentialsServiceError({
      actionId,
      serviceId,
      reason:
        permission.reason,
      permission,
    })
  }

  if (!permission.executable) {
    return createCredentialsServiceError({
      actionId,
      serviceId,
      reason:
        permission.reason,
      permission,
    })
  }

  const credentialStatus =
    inspectCredentialService({
      serviceId,
      environment,
      runtimeState,
    })

  if (!credentialStatus.success) {
    return createCredentialsServiceError({
      actionId,
      serviceId:
        credentialStatus.serviceId,
      reason:
        credentialStatus.reason,
      permission,
    })
  }

  const tokenExpired =
    credentialStatus.status ===
    CONNECTION_STATUS.TOKEN_EXPIRED

  return {
    success:
      true,

    serviceId:
      credentialStatus.serviceId,

    actionId,

    reason:
      tokenExpired
        ? "Palvelun token on vanhentunut."
        : "Tokenin tila tarkistettiin.",

    permission,

    tokenStatus: {
      expired:
        tokenExpired,

      refreshSupported:
        credentialStatus
          .supportsTokenRefresh,

      connectionStatus:
        credentialStatus.status,

      humanLoginRequired:
        credentialStatus
          .humanLoginRequired,
    },

    secretValuesExposed:
      false,
  }
}


function evaluateCredentialsAction({
  actionId,
  approved = false,
  humanLoginCompleted = false,
} = {}) {
  const permission =
    checkCredentialsPermission({
      actionId,
      approved,
      humanLoginCompleted,
    })

  return {
    success:
      permission.allowed,

    actionId,

    permission,

    executable:
      permission.executable,

    reason:
      permission.reason,

    secretValuesExposed:
      false,
  }
}


function getCredentialsServiceSummary() {
  const registrySummary =
    getCredentialsRegistrySummary()

  return {
    name:
      "Credentials Service",

    version:
      CREDENTIALS_SERVICE_VERSION,

    status:
      "active",

    maturity:
      "mvp",

    registry:
      registrySummary,

    supportedActions:
      Object.values(
        CREDENTIAL_ACTIONS,
      ),

    permissionCapability:
      "credentials",

    secretValuesExposed:
      false,
  }
}


export {
  CREDENTIAL_ACTIONS,
  CREDENTIALS_SERVICE_VERSION,
  evaluateCredentialsAction,
  getCredentialsServiceSummary,
  inspectAllServiceConnections,
  inspectServiceConnection,
  inspectTokenStatus,
}