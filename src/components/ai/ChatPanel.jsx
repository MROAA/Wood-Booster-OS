import { useState } from "react"

const API_URL = "http://localhost:3001/api"


function ChatPanel() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)


  async function sendMessage() {
    if (!message.trim()) {
      return
    }

    const userMessage = {
      role: "user",
      content: message,
    }


    setMessages((current) => [
      ...current,
      userMessage,
    ])

    setMessage("")
    setLoading(true)


    try {
      const response = await fetch(
        `${API_URL}/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage.content,
          }),
        },
      )


      const data = await response.json()


      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            data.message ||
            "AI ei palauttanut vastausta.",
        },
      ])

    } catch (error) {

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "Yhteys AI-palvelimeen epäonnistui.",
        },
      ])

    } finally {
      setLoading(false)
    }
  }


  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900">

      <div className="min-h-[500px] space-y-4 p-6">

        {messages.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-neutral-400">
            Aloita keskustelu AI Brainin kanssa.
          </div>
        )}


        {messages.map((item, index) => (
          <div
            key={index}
            className={
              item.role === "user"
                ? "ml-auto max-w-xl rounded-xl bg-amber-500 p-4 text-neutral-950"
                : "max-w-xl rounded-xl bg-neutral-800 p-4 text-white"
            }
          >
            {item.content}
          </div>
        ))}


        {loading && (
          <div className="rounded-xl bg-neutral-800 p-4 text-neutral-400">
            AI ajattelee...
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
              if (event.key === "Enter") {
                sendMessage()
              }
            }}
            placeholder="Kysy AI Brainilta..."
            className="flex-1 rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white"
          />


          <button
            type="button"
            onClick={sendMessage}
            disabled={loading}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-neutral-950"
          >
            Lähetä
          </button>

        </div>

      </div>

    </section>
  )
}


export default ChatPanel
