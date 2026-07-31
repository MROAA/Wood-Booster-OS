/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CREDENTIALS REGISTRY V1

Vastuut:
- rekisteröi ulkoiset palvelut
- määrittelee palveluiden tunnistetarpeet
- tarkistaa ympäristömuuttujien olemassaolon
- kertoo yhteyden turvallisen tilan
- piilottaa salaiset arvot
- valmistelee tulevaa OAuth-kerrosta

Credentials Registry ei:
- muodosta verkkoyhteyksiä
- suorita OAuth-kirjautumista
- uusi tokeneita
- julkaise sisältöä
- näytä salaisuuksien raaka-arvoja
- kirjoita tunnuksia tiedostoihin
=====================================
*/


const CREDENTIALS_REGISTRY_VERSION =
  "1.0.0"


const CONNECTION_STATUS =
  Object.freeze({
    NOT_CONFIGURED:
      "not_configured",

    PARTIALLY_CONFIGURED:
      "partially_configured",

    CONFIGURED:
      "configured",

    LOGIN_REQUIRED:
      "login_required",

    CONNECTION_CHECK_REQUIRED:
      "connection_check_required",

    CONNECTED:
      "connected",

    TOKEN_EXPIRED:
      "token_expired",

    ERROR:
      "error",
  })


const AUTH_TYPES =
  Object.freeze({
    API_KEY:
      "api_key",

    OAUTH2:
      "oauth2",

    ACCESS_TOKEN:
      "access_token",

    NONE:
      "none",
  })


const SERVICE_IDS =
  Object.freeze({
    MOLTBOOK:
      "moltbook",

    X:
      "x",

    INSTAGRAM:
      "instagram",

    FACEBOOK:
      "facebook",
  })


const credentialRegistry =
  Object.freeze({
    moltbook: {
      id:
        SERVICE_IDS.MOLTBOOK,

      name:
        "Moltbook",

      authType:
        AUTH_TYPES.API_KEY,

      enabled:
        true,

      requiredEnvironmentVariables: [
        "MOLTBOOK_AGENT_API_KEY",
      ],

      optionalEnvironmentVariables: [
        "MOLTBOOK_APP_KEY",
      ],

      humanLoginRequired:
        false,

      supportsTokenRefresh:
        false,

      description:
        "Moltbook-agentin API-yhteys.",
    },

    x: {
      id:
        SERVICE_IDS.X,

      name:
        "X",

      authType:
        AUTH_TYPES.OAUTH2,

      enabled:
        true,

      requiredEnvironmentVariables: [
        "X_CLIENT_ID",
        "X_CLIENT_SECRET",
      ],

      optionalEnvironmentVariables: [
        "X_ACCESS_TOKEN",
        "X_REFRESH_TOKEN",
      ],

      humanLoginRequired:
        true,

      supportsTokenRefresh:
        true,

      description:
        "X-palvelun OAuth 2.0 -yhteys.",
    },

    instagram: {
      id:
        SERVICE_IDS.INSTAGRAM,

      name:
        "Instagram",

      authType:
        AUTH_TYPES.OAUTH2,

      enabled:
        true,

      requiredEnvironmentVariables: [
        "META_APP_ID",
        "META_APP_SECRET",
        "INSTAGRAM_USER_ID",
      ],

      optionalEnvironmentVariables: [
        "META_USER_ACCESS_TOKEN",
        "META_PAGE_ACCESS_TOKEN",
      ],

      humanLoginRequired:
        true,

      supportsTokenRefresh:
        true,

      description:
        "Instagram Professional -tilin Meta API -yhteys.",
    },

    facebook: {
      id:
        SERVICE_IDS.FACEBOOK,

      name:
        "Facebook",

      authType:
        AUTH_TYPES.OAUTH2,

      enabled:
        true,

      requiredEnvironmentVariables: [
        "META_APP_ID",
        "META_APP_SECRET",
        "META_PAGE_ID",
      ],

      optionalEnvironmentVariables: [
        "META_USER_ACCESS_TOKEN",
        "META_PAGE_ACCESS_TOKEN",
      ],

      humanLoginRequired:
        true,

      supportsTokenRefresh:
        true,

      description:
        "Facebook-sivun Meta API -yhteys.",
    },
  })


function normalizeIdentifier(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
}


function hasEnvironmentValue(
  environmentVariable,
  environment = process.env,
) {
  const value =
    environment?.[
      environmentVariable
    ]

  return (
    typeof value ===
      "string" &&
    value.trim().length >
      0
  )
}


function maskSecretValue(value) {
  const normalizedValue =
    String(value || "")
      .trim()

  if (!normalizedValue) {
    return null
  }

  if (
    normalizedValue.length <=
    4
  ) {
    return "****"
  }

  const visibleEnd =
    normalizedValue.slice(-4)

  return `****${visibleEnd}`
}


function getCredentialService(
  serviceId,
) {
  const normalizedServiceId =
    normalizeIdentifier(
      serviceId,
    )

  return (
    credentialRegistry[
      normalizedServiceId
    ] ||
    null
  )
}


function inspectEnvironmentVariables({
  environmentVariables,
  environment = process.env,
}) {
  return environmentVariables.map(
    (
      environmentVariable,
    ) => {
      return {
        name:
          environmentVariable,

        configured:
          hasEnvironmentValue(
            environmentVariable,
            environment,
          ),
      }
    },
  )
}


function determineConnectionStatus({
  service,
  requiredCredentials,
  optionalCredentials,
  runtimeState = {},
}) {
  const requiredConfiguredCount =
    requiredCredentials.filter(
      (credential) =>
        credential.configured,
    ).length

  const requiredCount =
    requiredCredentials.length

  const optionalConfiguredCount =
    optionalCredentials.filter(
      (credential) =>
        credential.configured,
    ).length

  if (
    runtimeState.error
  ) {
    return CONNECTION_STATUS.ERROR
  }

  if (
    runtimeState.tokenExpired
  ) {
    return CONNECTION_STATUS
      .TOKEN_EXPIRED
  }

  if (
    runtimeState.connected
  ) {
    return CONNECTION_STATUS
      .CONNECTED
  }

  if (
    requiredConfiguredCount ===
      0 &&
    optionalConfiguredCount ===
      0
  ) {
    return CONNECTION_STATUS
      .NOT_CONFIGURED
  }

  if (
    requiredConfiguredCount <
    requiredCount
  ) {
    return CONNECTION_STATUS
      .PARTIALLY_CONFIGURED
  }

  if (
    service.humanLoginRequired &&
    optionalConfiguredCount ===
      0
  ) {
    return CONNECTION_STATUS
      .LOGIN_REQUIRED
  }

  if (
    requiredConfiguredCount ===
    requiredCount
  ) {
    return CONNECTION_STATUS
      .CONNECTION_CHECK_REQUIRED
  }

  return CONNECTION_STATUS
    .NOT_CONFIGURED
}


function inspectCredentialService({
  serviceId,
  environment = process.env,
  runtimeState = {},
}) {
  const normalizedServiceId =
    normalizeIdentifier(
      serviceId,
    )

  const service =
    getCredentialService(
      normalizedServiceId,
    )

  if (!service) {
    return {
      success:
        false,

      serviceId:
        normalizedServiceId,

      status:
        CONNECTION_STATUS.ERROR,

      reason:
        "Palvelua ei ole rekisteröity.",
    }
  }

  const requiredCredentials =
    inspectEnvironmentVariables({
      environmentVariables:
        service
          .requiredEnvironmentVariables,

      environment,
    })

  const optionalCredentials =
    inspectEnvironmentVariables({
      environmentVariables:
        service
          .optionalEnvironmentVariables,

      environment,
    })

  const missingRequiredCredentials =
    requiredCredentials
      .filter(
        (credential) =>
          !credential.configured,
      )
      .map(
        (credential) =>
          credential.name,
      )

  const configuredOptionalCredentials =
    optionalCredentials
      .filter(
        (credential) =>
          credential.configured,
      )
      .map(
        (credential) =>
          credential.name,
      )

  const status =
    determineConnectionStatus({
      service,
      requiredCredentials,
      optionalCredentials,
      runtimeState,
    })

  return {
    success:
      true,

    serviceId:
      service.id,

    serviceName:
      service.name,

    description:
      service.description,

    authType:
      service.authType,

    enabled:
      service.enabled,

    status,

    configured:
      missingRequiredCredentials
        .length === 0,

    connected:
      status ===
      CONNECTION_STATUS.CONNECTED,

    humanLoginRequired:
      service
        .humanLoginRequired,

    supportsTokenRefresh:
      service
        .supportsTokenRefresh,

    requiredCredentials,

    optionalCredentials,

    missingRequiredCredentials,

    configuredOptionalCredentials,

    secretValuesExposed:
      false,
  }
}


function inspectAllCredentialServices({
  environment = process.env,
  runtimeStates = {},
} = {}) {
  return Object.keys(
    credentialRegistry,
  ).map(
    (serviceId) => {
      return inspectCredentialService({
        serviceId,

        environment,

        runtimeState:
          runtimeStates[
            serviceId
          ] ||
          {},
      })
    },
  )
}


function getSafeCredentialPreview({
  environmentVariable,
  environment = process.env,
}) {
  const value =
    environment?.[
      environmentVariable
    ]

  return {
    environmentVariable,

    configured:
      hasEnvironmentValue(
        environmentVariable,
        environment,
      ),

    maskedValue:
      maskSecretValue(
        value,
      ),

    rawValueExposed:
      false,
  }
}


function getCredentialsRegistrySummary() {
  const serviceIds =
    Object.keys(
      credentialRegistry,
    )

  return {
    name:
      "Credentials Registry",

    version:
      CREDENTIALS_REGISTRY_VERSION,

    status:
      "active",

    maturity:
      "mvp",

    serviceCount:
      serviceIds.length,

    serviceIds,

    supportedAuthTypes:
      Object.values(
        AUTH_TYPES,
      ),

    secretValuesExposed:
      false,
  }
}


function listCredentialServices() {
  return Object.values(
    credentialRegistry,
  ).map(
    (service) => {
      return {
        id:
          service.id,

        name:
          service.name,

        authType:
          service.authType,

        enabled:
          service.enabled,

        humanLoginRequired:
          service
            .humanLoginRequired,

        supportsTokenRefresh:
          service
            .supportsTokenRefresh,

        description:
          service.description,

        requiredEnvironmentVariables:
          [
            ...service
              .requiredEnvironmentVariables,
          ],

        optionalEnvironmentVariables:
          [
            ...service
              .optionalEnvironmentVariables,
          ],
      }
    },
  )
}


export {
  AUTH_TYPES,
  CONNECTION_STATUS,
  CREDENTIALS_REGISTRY_VERSION,
  SERVICE_IDS,
  getCredentialService,
  getCredentialsRegistrySummary,
  getSafeCredentialPreview,
  inspectAllCredentialServices,
  inspectCredentialService,
  listCredentialServices,
  maskSecretValue,
}