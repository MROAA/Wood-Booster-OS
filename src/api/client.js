const API_URL =
  "http://localhost:3001/api"


async function readResponse(response) {
  const contentType =
    response.headers.get(
      "content-type",
    ) || ""

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    return response.json()
  }

  const text =
    await response.text()

  return text
    ? { message: text }
    : {}
}


async function apiRequest(
  path,
  options = {},
) {
  const response =
    await fetch(
      `${API_URL}${path}`,
      options,
    )

  const data =
    await readResponse(response)

  if (!response.ok) {
    const errorMessage =
      data?.error ||
      data?.message ||
      `API error ${response.status}`

    throw new Error(
      errorMessage,
    )
  }

  return data
}


export async function apiGet(path) {
  return apiRequest(path)
}


export async function apiPost(
  path,
  data,
) {
  return apiRequest(
    path,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(data),
    },
  )
}


export async function apiPut(
  path,
  data,
) {
  return apiRequest(
    path,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(data),
    },
  )
}


export async function apiDelete(path) {
  return apiRequest(
    path,
    {
      method: "DELETE",
    },
  )
}


export async function apiUpload(
  path,
  formData,
) {
  return apiRequest(
    path,
    {
      method: "POST",

      body:
        formData,
    },
  )
}
