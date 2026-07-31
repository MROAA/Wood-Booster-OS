import {
  apiPost,
} from "../../api/client"

function createResult({
  success,
  type,
  message,
  path = null,
  action = null,
  data = null,
}) {
  return {
    success,
    type,
    message,
    path,
    action,
    data,
  }
}

function normalizeCustomerPayload(action) {
  const payload =
    action.payload || {}

  return {
    name: String(
      payload.name ||
      action.name ||
      "",
    ).trim(),

    email: String(
      payload.email ||
      action.email ||
      "",
    ).trim(),

    phone: String(
      payload.phone ||
      action.phone ||
      "",
    ).trim(),

    company: String(
      payload.company ||
      action.company ||
      "",
    ).trim(),

    notes: String(
      payload.notes ??
      action.notes ??
      "",
    ).trim(),
  }
}

function isValidEmail(email) {
  if (!email) {
    return true
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email,
  )
}

function supportsCustomerAction(
  actionType,
) {
  return actionType ===
    "create_customer"
}

async function executeCustomerTool({
  action,
  navigate,
}) {
  const customer =
    normalizeCustomerPayload(action)

  if (customer.name.length < 2) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Asiakkaan nimi puuttuu tai on liian lyhyt.",
      action,
    })
  }

  if (customer.name.length > 120) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Asiakkaan nimi on liian pitkä.",
      action,
    })
  }

  if (!isValidEmail(customer.email)) {
    return createResult({
      success: false,
      type: "invalid",
      message:
        "Asiakkaan sähköpostiosoite ei ole kelvollinen.",
      action,
    })
  }

  const requestBody = {
    name: customer.name,
  }

  if (customer.email) {
    requestBody.email =
      customer.email
  }

  if (customer.phone) {
    requestBody.phone =
      customer.phone
  }

  if (customer.company) {
    requestBody.company =
      customer.company
  }

  if (customer.notes) {
    requestBody.notes =
      customer.notes
  }

  try {
    const response =
      await apiPost(
        "/customers",
        requestBody,
      )

    const createdCustomer =
      response.customer ||
      response.data ||
      response

    const customerId =
      createdCustomer?.id

    if (!customerId) {
      navigate("/customers")

      return createResult({
        success: true,
        type: "create_customer",
        message: `Asiakas "${customer.name}" luotiin. Asiakkaat avattiin.`,
        path: "/customers",
        action,
        data: createdCustomer,
      })
    }

    const path =
      `/customers/${encodeURIComponent(
        customerId,
      )}`

    navigate(path)

    return createResult({
      success: true,
      type: "create_customer",
      message: `Asiakas "${customer.name}" luotiin onnistuneesti.`,
      path,
      action,
      data: createdCustomer,
    })
  } catch (error) {
    console.error(
      "Customer Tool error:",
      error,
    )

    return createResult({
      success: false,
      type: "api_error",
      message:
        error?.message ||
        "Asiakkaan luominen epäonnistui.",
      action,
    })
  }
}

export {
  executeCustomerTool,
  supportsCustomerAction,
}
