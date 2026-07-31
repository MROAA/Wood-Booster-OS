const API_URL = "http://localhost:3001/api/customers"

export async function readCustomers() {
  const response = await fetch(API_URL)

  if (!response.ok) {
    throw new Error("Asiakkaiden haku epäonnistui")
  }

  return await response.json()
}

export async function createCustomer(customerData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(customerData),
  })

  if (!response.ok) {
    throw new Error("Asiakkaan tallennus epäonnistui")
  }

  return await response.json()
}

export async function deleteCustomer(customerId) {
  const response = await fetch(
    `${API_URL}/${customerId}`,
    {
      method: "DELETE",
    },
  )

  if (!response.ok) {
    throw new Error("Asiakkaan poisto epäonnistui")
  }

  return await response.json()
}
export async function getCustomer(customerId) {
  const response = await fetch(
    `${API_URL}/${customerId}`,
  )

  if (!response.ok) {
    throw new Error("Asiakasta ei löytynyt")
  }

  return await response.json()
}