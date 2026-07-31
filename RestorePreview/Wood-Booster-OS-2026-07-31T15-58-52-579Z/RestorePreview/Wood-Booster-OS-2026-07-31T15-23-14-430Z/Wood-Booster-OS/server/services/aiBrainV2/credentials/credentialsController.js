/*
=====================================
WOOD-BOOSTER AI BRAIN V2

CREDENTIALS CONTROLLER V1

Vastuut:
- tarjoaa yhden rajapinnan credentials-toiminnoille
- ohjaa pyynnöt Credentials Serviceen
- muotoilee tulokset Status Formatterilla
- validoi toiminnon ja serviceId:n
- palauttaa turvallisen chat-kelpoisen vastauksen

Credentials Controller ei:
- lue salaisuuksien arvoja
- muuta environment-muuttujia
- tee verkkokutsuja
- suorita OAuth-kirjautumista
- uusi tokeneita
=====================================
*/


import {
  evaluateCredentialsAction,
  inspectAllServiceConnections,
  inspectServiceConnection,
} from "./credentialsService.js"

import {
  formatAllServiceConnections,
  formatServiceConnectionResult,
} from "./credentialsStatusFormatter.js"


const CREDENTIALS_CONTROLLER_VERSION =
  "1.0.0"


const CONTROLLER_ACTIONS =
  Object.freeze({
    INSPECT_SERVICE:
      "inspect_service",

    INSPECT_ALL_SERVICES:
      "inspect_all_services",

    EVALUATE_ACTION:
      "evaluate_action",
  })


function createControllerError({
  action = null,
  serviceId = null,
  reason,
}) {
  return {
    success:
      false,

    controller:
      "credentials",

    action,

    serviceId,

    message:
      reason,

    data:
      null,

    secretValuesExposed:
      false,
  }
}


function normalizeValue(value) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase()
}


function handleInspectService({
  serviceId,
}) {
  const normalizedServiceId =
    normalizeValue(serviceId)

  if (!normalizedServiceId) {
    return createControllerError({
      action:
        CONTROLLER_ACTIONS
          .INSPECT_SERVICE,

      reason:
        "Palvelun tunniste puuttuu.",
    })
  }

  const serviceResult =
    inspectServiceConnection({
      serviceId:
        normalizedServiceId,
    })

  const formattedResult =
    formatServiceConnectionResult(
      serviceResult,
    )

  return {
    success:
      formattedResult.success,

    controller:
      "credentials",

    action:
      CONTROLLER_ACTIONS
        .INSPECT_SERVICE,

    serviceId:
      normalizedServiceId,

    message:
      formattedResult.message,

    data:
      formattedResult,

    secretValuesExposed:
      false,
  }
}


function handleInspectAllServices() {
  const servicesResult =
    inspectAllServiceConnections()

  const formattedResult =
    formatAllServiceConnections(
      servicesResult,
    )

  return {
    success:
      formattedResult.success,

    controller:
      "credentials",

    action:
      CONTROLLER_ACTIONS
        .INSPECT_ALL_SERVICES,

    serviceId:
      null,

    message:
      formattedResult.message,

    data:
      formattedResult,

    secretValuesExposed:
      false,
  }
}


function handleEvaluateAction({
  credentialsAction,
}) {
  const normalizedAction =
    normalizeValue(
      credentialsAction,
    )

  if (!normalizedAction) {
    return createControllerError({
      action:
        CONTROLLER_ACTIONS
          .EVALUATE_ACTION,

      reason:
        "Arvioitava credentials-toiminto puuttuu.",
    })
  }

  const evaluation =
    evaluateCredentialsAction({
      actionId:
        normalizedAction,
    })

  return {
    success:
      evaluation.success,

    controller:
      "credentials",

    action:
      CONTROLLER_ACTIONS
        .EVALUATE_ACTION,

    credentialsAction:
      normalizedAction,

    message:
      evaluation.reason,

    data:
      evaluation,

    secretValuesExposed:
      false,
  }
}


function handleCredentialsRequest({
  action,
  serviceId = null,
  credentialsAction = null,
} = {}) {
  const normalizedAction =
    normalizeValue(action)

  switch (normalizedAction) {
    case CONTROLLER_ACTIONS
      .INSPECT_SERVICE:
      return handleInspectService({
        serviceId,
      })

    case CONTROLLER_ACTIONS
      .INSPECT_ALL_SERVICES:
      return handleInspectAllServices()

    case CONTROLLER_ACTIONS
      .EVALUATE_ACTION:
      return handleEvaluateAction({
        credentialsAction,
      })

    default:
      return createControllerError({
        action:
          normalizedAction ||
          null,

        serviceId:
          serviceId || null,

        reason:
          "Tuntematon credentials controller -toiminto.",
      })
  }
}


function getCredentialsControllerSummary() {
  return {
    name:
      "Credentials Controller",

    version:
      CREDENTIALS_CONTROLLER_VERSION,

    status:
      "active",

    maturity:
      "mvp",

    supportedActions:
      Object.values(
        CONTROLLER_ACTIONS,
      ),

    outputLanguage:
      "fi",

    secretValuesExposed:
      false,
  }
}


export {
  CONTROLLER_ACTIONS,
  CREDENTIALS_CONTROLLER_VERSION,
  getCredentialsControllerSummary,
  handleCredentialsRequest,
}