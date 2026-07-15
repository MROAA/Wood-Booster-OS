import { useState } from "react"
console.log("CHAT PANEL LADATTU")

const API_URL = "http://localhost:3001/api/ai"

function ChatPanel() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function sendMessage() {
    const trimmedMessage = message.trim()

    if (!trimmedMessage || loading) {
      return
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: trimmedMessage,
      },
    ])

    setMessage("")
    setLoading(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/brain-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
            history: messages,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
          "AI Brainin vastaus epäonnistui.",
        )
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.answer ||
            "AI ei palauttanut vastausta.",
        },
      ])

    } catch (error) {

      setError(
        error.message ||
        "Yhteys AI Brainiin epäonnistui.",
      )

    } finally {
      setLoading(false)
    }
  }


  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">

      <div className="min-h-[500px] space-y-4 p-6">

        {messages.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-400">
            <h2 className="text-lg font-semibold text-white">
              🧠 AI Brain
            </h2>

            <p className="mt-2">
              Aloita keskustelu tekoälyavustajan kanssa.
            </p>
          </div>
        )}

        {messages.map((item, index) => (
          <div
            key={index}
            className={
              item.role === "user"
                ? "ml-auto max-w-2xl rounded-xl bg-amber-500 p-4 text-neutral-950"
                : "max-w-2xl rounded-xl bg-neutral-800 p-4 text-white"
            }
          >
            {item.content}
          </div>
        ))}

        {loading && (
          <div className="rounded-xl bg-neutral-800 p-4 text-neutral-400">
            AI Brain käsittelee...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950 p-4 text-red-300">
            {error}
          </div>
        )}

      </div>


      <div className="border-t border-neutral-800 p-4">

        <div className="flex gap-3">

          <input
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                sendMessage()
              }
            }}
            placeholder="Kysy AI Brainilta..."
            className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white"
          />

          <button
            type="button"
onClick={() => {
  console.log("AI Brain nappia painettu")
  sendMessage()
}}            disabled={loading}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-neutral-950 disabled:opacity-50"
          >
            Lähetä
          </button>

        </div>

      </div>

    </section>
  )
}

export default ChatPanel