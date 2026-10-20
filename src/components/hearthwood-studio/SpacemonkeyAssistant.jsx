
import { useRef, useState } from "react"

const API_BASE =
  import.meta.env.VITE_HEARTHWOOD_DEV_API_URL ||
  "http://127.0.0.1:3002/api"

const INITIAL_MESSAGE = {
  id: 1,
  role: "assistant",
  content:
    "Hei! Olen Spacemonkey, Hearthwoodin kehitysavustaja. " +
    "Kerro, mitä haluat tutkia tai kehittää. " +
    "Valitsen sopivan työkalun automaattisesti.",
}

function inlineMarkdown(text) {
  return String(text)
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, index) => {
      if (
        part.startsWith("**") &&
        part.endsWith("**")
      ) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        )
      }

      if (
        part.startsWith("`") &&
        part.endsWith("`")
      ) {
        return (
          <code
            key={index}
            className="rounded bg-[var(--wood-panel)] px-1 font-mono text-xs"
          >
            {part.slice(1, -1)}
          </code>
        )
      }

      return part
    })
}

function MessageContent({ content }) {
  const lines = String(content || "")
    .replace(/&#x0*20;|&nbsp;/gi, " ")
    .replace(/\\\*\\\*/g, "**")
    .split("\n")

  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, index) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={index} className="h-2" />
        }

        const heading = trimmed.match(/^#{1,3}\s+(.+)/)

        if (heading) {
          return (
            <p key={index} className="pt-2 font-bold">
              {inlineMarkdown(heading[1])}
            </p>
          )
        }

        const bullet = trimmed.match(
          /^(?:[-*•]|\d+[.)])\s*(.+)/,
        )

        if (bullet) {
          return (
            <p key={index} className="pl-3">
              <span className="mr-2 text-[var(--wood-accent)]">
                •
              </span>
              {inlineMarkdown(bullet[1])}
            </p>
          )
        }

        return (
          <p key={index}>
            {inlineMarkdown(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

async function postJson(endpoint, body) {
  let response

  try {
    response = await fetch(
      `${API_BASE}/hearthwood-dev/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90000),
      },
    )
  } catch (error) {
    if (
      error.name === "TimeoutError" ||
      error.name === "AbortError"
    ) {
      throw new Error(
        "Spacemonkeyn pyyntö aikakatkaistiin.",
      )
    }

    throw new Error(
      "Yhteys Spacemonkey-palvelimeen epäonnistui. " +
      "Tarkista, että backend toimii portissa 3002.",
    )
  }

  let result

  try {
    result = await response.json()
  } catch {
    throw new Error(
      "Palvelin palautti virheellisen vastauksen.",
    )
  }

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.error ||
      "Spacemonkey ei pystynyt suorittamaan tehtävää.",
    )
  }

  return result
}

function CodeExcerpt({ title, filePath, content, partial }) {
  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-3">
      <p className="font-bold text-[var(--wood-accent)]">
        {title}
      </p>

      <p className="break-all font-mono text-xs text-[var(--wood-muted)]">
        {filePath}
      </p>

      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--wood-bg)] p-3 font-mono text-xs leading-relaxed text-[var(--wood-text)]">
        <code>{content || "Lähdekoodikatkelma puuttuu."}</code>
      </pre>

      {partial && (
        <p className="text-xs text-[var(--wood-muted)]">
          Katkelma on osittainen.
        </p>
      )}
    </div>
  )
}

function SourceDetails({ analysis }) {
  if (!analysis) return null

  const verified = analysis.verifiedSources || []
  const dependencies = analysis.dependencySources || []
  const unresolved = analysis.unresolvedDependencies || []
  const inspected = analysis.inspectedFiles || []

  return (
    <details className="mt-3 rounded-xl border border-[var(--wood-border)] p-3 text-xs">
      <summary className="cursor-pointer font-semibold text-[var(--wood-accent)]">
        Näytä lähdekoodin tarkistustiedot
      </summary>

      <div className="mt-3 space-y-4">
        <p className="text-[var(--wood-muted)]">
          Lähdekoodikatkelmat ovat suoraan Hearthwoodin
          tiedostoista. Spacemonkeyn sanallinen tulkinta
          ei ole automaattisesti täysin varmennettu.
        </p>

        {verified.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Todennetut funktiot ({verified.length})
            </h3>

            {verified.map((item, index) => (
              <CodeExcerpt
                key={`${item.filePath}-${item.symbol}-${index}`}
                title={item.symbol}
                filePath={item.filePath}
                content={item.source}
                partial={item.truncated}
              />
            ))}
          </section>
        )}

        {dependencies.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Todennetut riippuvuudet ({dependencies.length})
            </h3>

            {dependencies.map((item, index) => (
              <CodeExcerpt
                key={`${item.filePath}-${item.symbol}-${index}`}
                title={item.symbol}
                filePath={item.filePath}
                content={item.excerpt}
                partial={item.partial}
              />
            ))}
          </section>
        )}

        {unresolved.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Selvittämättömät riippuvuudet
            </h3>

            {unresolved.map((item, index) => (
              <p
                key={index}
                className="break-words text-[var(--wood-muted)]"
              >
                {item.symbol} — {item.reason}
              </p>
            ))}
          </section>
        )}

        {inspected.length > 0 && (
          <section className="space-y-2">
            <h3 className="font-bold text-[var(--wood-text)]">
              Tutkitut tiedostot
            </h3>

            {inspected.map((item, index) => (
              <p
                key={index}
                className="break-all font-mono text-xs text-[var(--wood-muted)]"
              >
                {item.filePath}
                {item.truncated ? " (osittainen)" : ""}
              </p>
            ))}
          </section>
        )}

        {analysis.warning && (
          <p className="border-t border-[var(--wood-border)] pt-3 text-[var(--wood-muted)]">
            {analysis.warning}
          </p>
        )}
      </div>
    </details>
  )
}

export default function SpacemonkeyAssistant() {
  const [messages, setMessages] = useState([
    INITIAL_MESSAGE,
  ])

  const [input, setInput] = useState("")
  const [working, setWorking] = useState(false)

  const nextId = useRef(2)
  const busy = useRef(false)

  function addMessage(role, content, extra = {}) {
    setMessages(previous => [
      ...previous,
      {
        id: nextId.current++,
        role,
        content,
        ...extra,
      },
    ])
  }

  async function send(event) {
    event?.preventDefault()

    const text = input.trim()

    if (!text || busy.current) return

    busy.current = true
    setWorking(true)
    setInput("")

    addMessage("user", text)

    try {
      const route = await postJson("route", {
        prompt: text,
      })

      if (route.requiresApproval) {
        addMessage(
          "assistant",
          "Tämä tehtävä vaatii hyväksynnän. " +
          "Mitään muutoksia ei tehty.",
        )
        return
      }

      if (!route.matched || !route.apiReady) {
        addMessage(
          "assistant",
          "En löytänyt tähän tehtävään vielä " +
          "käytettävissä olevaa työkalua.",
        )
        return
      }

      const skill = route.skill?.id

      if (skill === "code-analysis") {
        const result = await postJson("analyze", {
          prompt: text,
        })

        addMessage(
          "assistant",
          result.answer ||
            "Analyysia ei voitu muodostaa.",
          { analysis: result },
        )
        return
      }

      if (skill === "change-planning") {
        const result = await postJson("plan", {
          prompt: text,
        })

        addMessage(
          "assistant",
          result.explanation ||
            "Muutossuunnitelma valmistui.",
        )
        return
      }

      addMessage(
        "assistant",
        "Tunnistin tehtävän, mutta tätä työkalua " +
        "ei ole vielä yhdistetty päästudioon. " +
        "Pelin tiedostoja ei muutettu.",
      )
    } catch (error) {
      addMessage(
        "assistant",
        `Tehtävä epäonnistui: ${error.message}`,
        { error: true },
      )
    } finally {
      busy.current = false
      setWorking(false)
    }
  }

  return (
    <section
      className="space-y-3 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4"
      data-testid="spacemonkey-assistant"
    >
      <div>
        <h2 className="text-lg font-bold text-[var(--wood-text)]">
          Spacemonkey
        </h2>

        <p className="text-xs text-[var(--wood-muted)]">
          Hearthwoodin älykäs kehitysavustaja
        </p>
      </div>

      <div
        className="max-h-[440px] min-h-[180px] space-y-3 overflow-y-auto rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3"
        aria-live="polite"
      >
        {messages.map(message => (
          <div
            key={message.id}
            className={`rounded-xl border border-[var(--wood-border)] p-3 ${
              message.role === "user"
                ? "ml-6 bg-[var(--wood-panel)]"
                : "mr-6"
            }`}
          >
            <p className="mb-2 text-xs font-bold text-[var(--wood-accent)]">
              {message.role === "user"
                ? "Sinä"
                : "Spacemonkey"}
            </p>

            <div
              className={
                message.error
                  ? "text-red-400"
                  : "text-[var(--wood-text)]"
              }
            >
              <MessageContent content={message.content} />
            </div>

            <SourceDetails analysis={message.analysis} />
          </div>
        ))}

        {working && (
          <p className="text-sm text-[var(--wood-muted)]">
            Spacemonkey tutkii tehtävää...
          </p>
        )}
      </div>

      <form
        onSubmit={send}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <textarea
          value={input}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              send()
            }
          }}
          rows={2}
          disabled={working}
          placeholder="Mitä haluat tehdä Hearthwoodissa?"
          aria-label="Viesti Spacemonkeylle"
          className="min-w-0 flex-1 resize-y rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 text-sm text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
        />

        <button
          type="submit"
          disabled={!input.trim() || working}
          className="self-end rounded-xl bg-[var(--wood-accent)] px-5 py-3 text-sm font-bold text-[#17120c] disabled:opacity-40"
        >
          Lähetä
        </button>
      </form>
    </section>
  )
}
