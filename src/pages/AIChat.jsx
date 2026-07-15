import { useEffect, useMemo, useRef, useState } from "react"

const API_URL = "http://localhost:3001/api"

const exampleQuestions = [
  "Miten Wood-Boosterin pitäisi kirjoittaa brändistään?",
  "Kirjoita verkkosivulle teksti aiheesta Me jatkamme puun tarinaa.",
  "Mitä AI Brain tietää Puustaajan arvoista?",
  "Laadi artikkeliluonnos puun epätäydellisyyden kauneudesta.",
]

function AIChat() {
  const messagesEndRef = useRef(null)

  const [messages, setMessages] = useState([
    {
      id: createId(),
      role: "assistant",
      content:
        "Hei! Olen Wood-Booster AI. Vastaan käyttäen AI Brainiin tallennettua tietoa ja näytän käyttämäni lähteet.",
      sources: [],
    },
  ])

  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [brainStatus, setBrainStatus] = useState(null)

  useEffect(() => {
    loadBrainStatus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages, sending])

  const latestSources = useMemo(() => {
    return [...messages]
      .reverse()
      .find(
        (message) =>
          Array.isArray(message.sources) &&
          message.sources.length > 0,
      )?.sources || []
  }, [messages])

  async function loadBrainStatus() {
    try {
      const response = await fetch(
        `${API_URL}/ai/brain-status`,
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI Brainin tilan lataaminen epäonnistui",
        )
      }

      setBrainStatus(data)
    } catch (statusError) {
      console.error(statusError)
      setBrainStatus(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const messageText = input.trim()

    if (!messageText || sending) {
      return
    }

    const history = messages
      .filter(
        (message) =>
          message.role === "user" ||
          message.role === "assistant",
      )
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))

    const userMessage = {
      id: createId(),
      role: "user",
      content: messageText,
      sources: [],
    }

    setMessages((current) => [
      ...current,
      userMessage,
    ])

    setInput("")
    setSending(true)
    setError("")

    try {
      const response = await fetch(
        `${API_URL}/ai/brain-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageText,
            history,
          }),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI Brainin vastaus epäonnistui",
        )
      }

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: data.answer,
          sources: Array.isArray(data.sources)
            ? data.sources
            : [],
          model: data.model,
        },
      ])
    } catch (chatError) {
      console.error(chatError)

      setError(
        chatError.message ||
          "Viestin lähettäminen epäonnistui.",
      )

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content:
            "En saanut yhteyttä AI Brainiin. Tarkista, että backend ja Ollama ovat käynnissä.",
          sources: [],
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function useExample(question) {
    setInput(question)
    setError("")
  }

  function clearChat() {
    setMessages([
      {
        id: createId(),
        role: "assistant",
        content:
          "Keskustelu tyhjennetty. Mitä haluat kysyä AI Brainilta?",
        sources: [],
      },
    ])

    setInput("")
    setError("")
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-500">
              Wood-Booster AI Brain
            </p>

            <h1 className="mt-3 text-4xl font-bold md:text-5xl">
              AI Assistant
            </h1>

            <p className="mt-4 max-w-3xl text-neutral-400">
              Keskustele Qwen3:n kanssa käyttäen omaa
              tietopankkiasi. Jokaisen vastauksen
              yhteydessä näet käytetyt lähteet.
            </p>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="self-start rounded-xl border border-neutral-700 px-4 py-3 text-sm text-neutral-300 transition hover:bg-neutral-800"
          >
            Tyhjennä keskustelu
          </button>
        </header>

        <BrainStatus status={brainStatus} />

        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
          <section className="flex min-h-[720px] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900">
            <div className="border-b border-neutral-800 px-6 py-5">
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Conversation
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Keskustelu
              </h2>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                />
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-neutral-800 px-5 py-4 text-neutral-300">
                    <p className="font-medium">
                      Wood-Booster AI ajattelee...
                    </p>

                    <p className="mt-2 text-sm text-neutral-500">
                      Haetaan tietoa AI Brainista ja
                      muodostetaan vastausta Qwen3:lla.
                    </p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-neutral-800 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <textarea
                  value={input}
                  onChange={(event) =>
                    setInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault()
                      handleSubmit(event)
                    }
                  }}
                  rows={3}
                  placeholder="Kysy esimerkiksi: Miten Wood-Boosterin pitäisi kirjoittaa brändistään?"
                  className="min-h-[92px] flex-1 resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-amber-500"
                />

                <button
                  type="submit"
                  disabled={
                    sending || !input.trim()
                  }
                  className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-neutral-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Odota..." : "Lähetä"}
                </button>
              </div>

              <p className="mt-3 text-xs text-neutral-600">
                Enter lähettää. Shift + Enter lisää
                uuden rivin.
              </p>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Example questions
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Kokeile näitä
              </h2>

              <div className="mt-5 space-y-3">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() =>
                      useExample(question)
                    }
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3 text-left text-sm leading-6 text-neutral-300 transition hover:border-amber-500/50 hover:text-amber-400"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
              <p className="text-xs uppercase tracking-wider text-neutral-500">
                Sources
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Viimeksi käytetyt lähteet
              </h2>

              {latestSources.length === 0 ? (
                <div className="mt-5 rounded-xl border border-dashed border-neutral-700 p-6 text-center">
                  <p className="text-3xl">📚</p>

                  <p className="mt-3 text-sm text-neutral-400">
                    Kysy AI Brainilta nähdäksesi
                    vastauksessa käytetyt lähteet.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {latestSources.map((source) => (
                    <SourceCard
                      key={`${source.documentId}-${source.chunkId}`}
                      source={source}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
              <p className="text-sm leading-6 text-neutral-300">
                Lisää uutta tietoa Knowledge Managerissa.
                Hyväksytty tieto tulee heti tämän
                assistentin käytettäväksi.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

function BrainStatus({ status }) {
  if (!status) {
    return (
      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4 text-sm text-neutral-400">
        AI Brainin tilaa ei voitu tarkistaa.
      </div>
    )
  }

  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatusCard
        label="Ollama"
        value={
          status.ollamaOnline
            ? "Käynnissä"
            : "Ei yhteyttä"
        }
        good={status.ollamaOnline}
      />

      <StatusCard
        label="Malli"
        value={status.model || "Ei tiedossa"}
        good={status.modelAvailable}
      />

      <StatusCard
        label="Dokumentit"
        value={String(status.documentCount || 0)}
        good
      />

      <StatusCard
        label="Tietopalat"
        value={String(status.chunkCount || 0)}
        good={(status.chunkCount || 0) > 0}
      />
    </section>
  )
}

function StatusCard({
  label,
  value,
  good = false,
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-4">
      <p className="text-xs uppercase tracking-wider text-neutral-600">
        {label}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            good
              ? "bg-green-400"
              : "bg-red-400"
          }`}
        />

        <p className="font-semibold text-neutral-200">
          {value}
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ message }) {
  const isUser = message.role === "user"
  const sources = Array.isArray(message.sources)
    ? message.sources
    : []

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[90%] rounded-2xl px-5 py-4 ${
          isUser
            ? "rounded-br-md bg-amber-500 text-neutral-950"
            : "rounded-bl-md bg-neutral-800 text-neutral-200"
        }`}
      >
        <div className="whitespace-pre-wrap leading-7">
          {message.content}
        </div>

        {!isUser && message.model && (
          <p className="mt-4 border-t border-neutral-700 pt-3 text-xs text-neutral-500">
            Malli: {message.model}
          </p>
        )}

        {!isUser && sources.length > 0 && (
          <div className="mt-4 border-t border-neutral-700 pt-4">
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Käytetyt lähteet
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {sources.map((source) => (
                <span
                  key={`${source.documentId}-${source.chunkId}`}
                  className="rounded-full bg-neutral-950 px-3 py-1 text-xs text-amber-400"
                >
                  {source.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SourceCard({ source }) {
  return (
    <article className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-neutral-200">
            {source.title}
          </h3>

          <p className="mt-1 text-xs text-amber-400">
            {source.topic || "Yleinen"}
          </p>
        </div>

        <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-500">
          {source.score}
        </span>
      </div>

      {source.excerpt && (
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          {source.excerpt}
        </p>
      )}

      {source.tags && (
        <p className="mt-3 text-xs text-neutral-600">
          {source.tags}
        </p>
      )}
    </article>
  )
}

function createId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()}`
}

export default AIChat
