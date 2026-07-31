const controller =
  new AbortController()


const timeout =
  setTimeout(
    () => controller.abort(),
    30000,
  )


console.log(
  "START REQUEST",
)


try {

  const response =
    await fetch(
      "http://localhost:11434/api/chat",
      {

        method:
          "POST",

        headers:
          {
            "Content-Type":
              "application/json",
          },

        signal:
          controller.signal,

        body:
          JSON.stringify({

            model:
              "qwen2.5:7b",

            stream:
              false,

            messages:
              [
                {
                  role:
                    "user",

                  content:
                    "Hei",
                },
              ],

          }),

      },
    )


  console.log(
    "HTTP STATUS",
    response.status,
  )


  const text =
    await response.text()


  console.log(
    "RAW RESPONSE",
  )


  console.log(text)


}

catch(error) {

  console.log(
    "ERROR",
  )


  console.log(
    error.message,
  )

}

finally {

  clearTimeout(
    timeout,
  )

}
