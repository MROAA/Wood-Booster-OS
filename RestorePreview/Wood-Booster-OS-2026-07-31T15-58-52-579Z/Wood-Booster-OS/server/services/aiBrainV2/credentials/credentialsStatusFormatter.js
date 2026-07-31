/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CREDENTIALS STATUS FORMATTER V1

Vastuut:
- muuttaa credentials-tilan selkokieliseksi
- muodostaa turvallisen chat-vastauksen
- selittää puuttuvat tunnukset
- kertoo vaaditun seuraavan vaiheen
- säilyttää teknisen tilakoodin
- varmistaa, ettei salaisuuksia näytetä

Credentials Status Formatter ei:
- tarkista käyttöoikeuksia
- lue ympäristömuuttujien arvoja
- muodosta verkkoyhteyksiä
- suorita OAuth-kirjautumista
- uusi tokeneita
- muuta credentials-tilaa
=====================================
*/


import {
  CONNECTION_STATUS,
} from "./credentialsRegistry.js"


const CREDENTIALS_STATUS_FORMATTER_VERSION =
  "1.0.0"


const STATUS_LABELS =
  Object.freeze({
    [CONNECTION_STATUS.NOT_CONFIGURED]:
      "Ei määritetty",

    [CONNECTION_STATUS.PARTIALLY_CONFIGURED]:
      "Osittain määritetty",

    [CONNECTION_STATUS.CONFIGURED]:
      "Määritetty",

    [CONNECTION_STATUS.LOGIN_REQUIRED]:
      "Kirjautuminen vaaditaan",

    [CONNECTION_STATUS.CONNECTION_CHECK_REQUIRED]:
      "Yhteys täytyy tarkistaa",

    [CONNECTION_STATUS.CONNECTED]:
      "Yhdistetty",

    [CONNECTION_STATUS.TOKEN_EXPIRED]:
      "Token on vanhentunut",

    [CONNECTION_STATUS.ERROR]:
      "Virhe",
  })


function createFormatterError({
  reason,
  serviceId = null,
}) {
  return {
    success:
      false,

    serviceId,

    status:
      CONNECTION_STATUS.ERROR,

    statusLabel:
      STATUS_LABELS[
        CONNECTION_STATUS.ERROR
      ],

    message:
      reason,

    nextAction:
      null,

    missingCredentials:
      [],

    secretValuesExposed:
      false,
  }
}


function normalizeCredentialNames(
  credentials,
) {
  if (!Array.isArray(credentials)) {
    return []
  }

  return credentials
    .map(
      (credential) =>
        String(
          credential || "",
        ).trim(),
    )
    .filter(Boolean)
}


function formatCredentialList(
  credentials,
) {
  const normalizedCredentials =
    normalizeCredentialNames(
      credentials,
    )

  if (
    normalizedCredentials.length ===
    0
  ) {
    return null
  }

  if (
    normalizedCredentials.length ===
    1
  ) {
    return (
      `Puuttuva tunnus: ` +
      `${normalizedCredentials[0]}.`
    )
  }

  return (
    "Puuttuvat tunnukset: " +
    normalizedCredentials.join(", ") +
    "."
  )
}


function createNextAction({
  status,
  serviceName,
  missingCredentials,
  supportsTokenRefresh,
}) {
  switch (status) {
    case CONNECTION_STATUS
      .NOT_CONFIGURED:
      return {
        type:
          "configure_credentials",

        requiresHumanAction:
          true,

        message:
          `Lisää ${serviceName}-palvelun ` +
          "tarvitsemat tunnukset.",
      }

    case CONNECTION_STATUS
      .PARTIALLY_CONFIGURED:
      return {
        type:
          "complete_configuration",

        requiresHumanAction:
          true,

        message:
          missingCredentials.length > 0
            ? "Lisää vielä puuttuvat tunnukset."
            : "Täydennä palvelun määritys.",
      }

    case CONNECTION_STATUS
      .LOGIN_REQUIRED:
      return {
        type:
          "complete_login",

        requiresHumanAction:
          true,

        message:
          `Kirjaudu ${serviceName}-palveluun ` +
          "ja hyväksy käyttöoikeudet.",
      }

    case CONNECTION_STATUS
      .CONNECTION_CHECK_REQUIRED:
      return {
        type:
          "check_connection",

        requiresHumanAction:
          false,

        message:
          "Tarkista palveluyhteyden toiminta.",
      }

    case CONNECTION_STATUS
      .TOKEN_EXPIRED:
      return {
        type:
          supportsTokenRefresh
            ? "refresh_token"
            : "login_again",

        requiresHumanAction:
          !supportsTokenRefresh,

        message:
          supportsTokenRefresh
            ? "Uusi vanhentunut token."
            : "Kirjaudu palveluun uudelleen.",
      }

    case CONNECTION_STATUS
      .CONNECTED:
      return {
        type:
          "none",

        requiresHumanAction:
          false,

        message:
          "Yhteys on käyttövalmis.",
      }

    case CONNECTION_STATUS
      .ERROR:
      return {
        type:
          "inspect_error",

        requiresHumanAction:
          false,

        message:
          "Tarkista palvelun yhteysvirhe.",
      }

    default:
      return {
        type:
          "inspect_status",

        requiresHumanAction:
          false,

        message:
          "Tarkista palvelun nykyinen tila.",
      }
  }
}


function createStatusMessage({
  serviceName,
  status,
  missingCredentials,
}) {
  const missingCredentialsText =
    formatCredentialList(
      missingCredentials,
    )

  const messageParts =
    []

  switch (status) {
    case CONNECTION_STATUS
      .NOT_CONFIGURED:
      messageParts.push(
        `${serviceName}-yhteyttä ei ole vielä määritetty.`,
      )
      break

    case CONNECTION_STATUS
      .PARTIALLY_CONFIGURED:
      messageParts.push(
        `${serviceName}-yhteys on määritetty vain osittain.`,
      )
      break

    case CONNECTION_STATUS
      .LOGIN_REQUIRED:
      messageParts.push(
        `${serviceName}-yhteys tarvitsee käyttäjän kirjautumisen.`,
      )
      break

    case CONNECTION_STATUS
      .CONNECTION_CHECK_REQUIRED:
      messageParts.push(
        `${serviceName}-tunnukset on määritetty, mutta yhteyttä ei ole vielä tarkistettu.`,
      )
      break

    case CONNECTION_STATUS
      .CONNECTED:
      messageParts.push(
        `${serviceName}-yhteys on muodostettu ja käyttövalmis.`,
      )
      break

    case CONNECTION_STATUS
      .TOKEN_EXPIRED:
      messageParts.push(
        `${serviceName}-palvelun token on vanhentunut.`,
      )
      break

    case CONNECTION_STATUS
      .ERROR:
      messageParts.push(
        `${serviceName}-yhteyden tarkistuksessa tapahtui virhe.`,
      )
      break

    default:
      messageParts.push(
        `${serviceName}-yhteyden tila ei ole tiedossa.`,
      )
  }

  if (missingCredentialsText) {
    messageParts.push(
      missingCredentialsText,
    )
  }

  messageParts.push(
    "Salaisia arvoja ei näytetty.",
  )

  return messageParts.join(" ")
}


function formatCredentialStatus(
  credentialStatus,
) {
  if (
    !credentialStatus ||
    typeof credentialStatus !==
      "object"
  ) {
    return createFormatterError({
      reason:
        "Credentials-tila puuttuu.",
    })
  }

  if (
    credentialStatus.success ===
      false
  ) {
    return createFormatterError({
      serviceId:
        credentialStatus.serviceId ||
        null,

      reason:
        credentialStatus.reason ||
        "Credentials-tilan tarkistus epäonnistui.",
    })
  }

  const serviceId =
    credentialStatus.serviceId ||
    null

  const serviceName =
    credentialStatus.serviceName ||
    serviceId ||
    "Tuntematon palvelu"

  const status =
    credentialStatus.status ||
    CONNECTION_STATUS.ERROR

  const missingCredentials =
    normalizeCredentialNames(
      credentialStatus
        .missingRequiredCredentials,
    )

  const nextAction =
    createNextAction({
      status,
      serviceName,
      missingCredentials,

      supportsTokenRefresh:
        Boolean(
          credentialStatus
            .supportsTokenRefresh,
        ),
    })

  return {
    success:
      true,

    serviceId,

    serviceName,

    status,

    statusLabel:
      STATUS_LABELS[status] ||
      "Tuntematon tila",

    message:
      createStatusMessage({
        serviceName,
        status,
        missingCredentials,
      }),

    nextAction,

    missingCredentials,

    configured:
      Boolean(
        credentialStatus.configured,
      ),

    connected:
      Boolean(
        credentialStatus.connected,
      ),

    humanLoginRequired:
      Boolean(
        credentialStatus
          .humanLoginRequired,
      ),

    supportsTokenRefresh:
      Boolean(
        credentialStatus
          .supportsTokenRefresh,
      ),

    secretValuesExposed:
      false,
  }
}


function formatServiceConnectionResult(
  serviceResult,
) {
  if (
    !serviceResult ||
    typeof serviceResult !==
      "object"
  ) {
    return createFormatterError({
      reason:
        "Palveluyhteyden tulos puuttuu.",
    })
  }

  if (
    serviceResult.success ===
      false
  ) {
    return createFormatterError({
      serviceId:
        serviceResult.serviceId ||
        null,

      reason:
        serviceResult.reason ||
        "Palveluyhteyden tarkistus epäonnistui.",
    })
  }

  return formatCredentialStatus(
    serviceResult.credentialStatus,
  )
}


function formatAllServiceConnections(
  allServicesResult,
) {
  if (
    !allServicesResult ||
    typeof allServicesResult !==
      "object"
  ) {
    return {
      success:
        false,

      message:
        "Palveluiden yhteystilat puuttuvat.",

      summary:
        null,

      services:
        [],

      secretValuesExposed:
        false,
    }
  }

  if (
    allServicesResult.success ===
      false
  ) {
    return {
      success:
        false,

      message:
        allServicesResult.reason ||
        "Palveluiden tarkistus epäonnistui.",

      summary:
        null,

      services:
        [],

      secretValuesExposed:
        false,
    }
  }

  const services =
    Array.isArray(
      allServicesResult.services,
    )
      ? allServicesResult.services.map(
          formatCredentialStatus,
        )
      : []

  const connectedServices =
    services.filter(
      (service) =>
        service.connected,
    )

  const actionRequiredServices =
    services.filter(
      (service) =>
        service.nextAction?.type !==
        "none",
    )

  return {
    success:
      true,

    message:
      connectedServices.length ===
        services.length &&
      services.length > 0
        ? "Kaikki palveluyhteydet ovat käyttövalmiita."
        : `${actionRequiredServices.length} palveluyhteyttä tarvitsee vielä toimenpiteitä.`,

    summary: {
      serviceCount:
        services.length,

      connectedCount:
        connectedServices.length,

      actionRequiredCount:
        actionRequiredServices.length,
    },

    services,

    secretValuesExposed:
      false,
  }
}


function getCredentialsStatusFormatterSummary() {
  return {
    name:
      "Credentials Status Formatter",

    version:
      CREDENTIALS_STATUS_FORMATTER_VERSION,

    status:
      "active",

    maturity:
      "mvp",

    supportedStatuses:
      Object.values(
        CONNECTION_STATUS,
      ),

    outputLanguage:
      "fi",

    secretValuesExposed:
      false,
  }
}


export {
  CREDENTIALS_STATUS_FORMATTER_VERSION,
  STATUS_LABELS,
  formatAllServiceConnections,
  formatCredentialStatus,
  formatServiceConnectionResult,
  getCredentialsStatusFormatterSummary,
}