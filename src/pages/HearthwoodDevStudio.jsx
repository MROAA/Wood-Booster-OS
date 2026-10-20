import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import SpacemonkeyIcon from "../components/branding/SpacemonkeyIcon"
import VerifiedSourcePanel from "../components/hearthwood-studio/VerifiedSourcePanel"
import DependencyInspector from "../components/hearthwood-studio/DependencyInspector"

const API_URL =
  import.meta.env.VITE_HEARTHWOOD_DEV_API_URL ||
  "http://localhost:3002/api"

const IMAGE_ALIASES = {
  spacemonkey: "src/assets/branding/Spacemonkey.png",
}

const INITIAL_MESSAGES = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hei! Olen Spacemonkey, Hearthwoodin kehitysavustaja. " +
      "Kerro omin sanoin, mitä haluat tutkia tai kehittää. " +
      "Valitsen käytettävissä olevista työkaluista sopivan automaattisesti.",
  },
]

function parseImageRequest(text) {
  const lower = text.toLowerCase()

  const explicitPath = text.match(
    /(?:src\/assets|public)\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp)/i,
  )

  let source = explicitPath?.[0]

  if (!source) {
    for (const [name, filePath] of Object.entries(IMAGE_ALIASES)) {
      if (lower.includes(name)) {
        source = filePath
        break
      }
    }
  }

  if (!source) {
    throw new Error(
      "En löytänyt tarkoitettua kuvaa. Anna kuvan polku " +
      "(src/assets/... tai public/...) tai käytä nimeä Spacemonkey.",
    )
  }

  const dimensions = text.match(
    /(\d{1,4})\s*[x×]\s*(\d{1,4})/i,
  )

  const singleSize = text.match(
    /(\d{1,4})\s*(?:px\b|piksel\w*)/i,
  )

  const resizeIntent =
    /muuta|pienenn|suurenn|skaala|kokoiseksi|kokoon|kooksi|resize/i

  if (resizeIntent.test(text) && dimensions) {
    return {
      action: "resize",
      source,
      width: Number(dimensions[1]),
      height: Number(dimensions[2]),
    }
  }

  if (resizeIntent.test(text) && singleSize) {
    const size = Number(singleSize[1])

    return {
      action: "resize",
      source,
      width: size,
      height: size,
    }
  }

  if (
    /(?:muunna|tallenna|tee|luo)[^\n]{0,120}png(?:-muotoon|ksi)?/i.test(
      text,
    )
  ) {
    return {
      action: "png",
      source,
    }
  }

  if (resizeIntent.test(text)) {
    throw new Error(
      "Kerro haluamasi kuvakoko, esimerkiksi 256 × 256 px. " +
      "En muuttanut alkuperäistä kuvaa.",
    )
  }

  if (
    /muokka|vaihda|poista|lisää|piirrä|taustanpoisto|tausta|väri|generoi/i.test(
      text,
    )
  ) {
    throw new Error(
      "Tämä kuvamuokkaus ei ole vielä käytettävissä. " +
      "Osaan nyt tarkistaa kuvan, muuttaa sen kokoa ja tehdä PNG-version.",
    )
  }

  return {
    action: "inspect",
    source,
  }
}

function routeToExecutableTask(text, routeResult) {
  if (
    !routeResult?.matched ||
    !routeResult?.apiReady ||
    routeResult?.requiresApproval
  ) {
    return null
  }

  const skillId = routeResult.skill?.id

  if (skillId === "code-analysis") {
    return {
      endpoint: "analyze",
      body: { prompt: text },
    }
  }

  if (skillId === "change-planning") {
    return {
      endpoint: "plan",
      body: { prompt: text },
    }
  }

  if (skillId === "image-studio") {
    return {
      endpoint: "image",
      body: parseImageRequest(text),
    }
  }

  return null
}

/**
 * Normalisoi AI:n vastauksen Markdown-esitystä varten.
 *
 * Poistaa yleisiä ylimääräisiä escape-merkkejä.
 * Ei muuta koodilohkojen tai rivinsisäisen koodin sisältöä.
 */
function normalizeAssistantMarkdown(content) {
  const text = String(content ?? "").replace(/\r\n?/g, "\n")

  return text
    .split(/(```[\s\S]*?```|`[^`\n]+`)/g)
    .map(part => {
      if (part.startsWith("`")) return part

      return part
        .replace(/&#x0*20;|&#0*32;|&nbsp;/gi, " ")
        .replace(/\\\*\\\*/g, "**")
        .replace(/(^|\n)([ \t]*\d+)\\\./g, "$1$2.")
        .replace(/(^|\n)([ \t]*)\\-/g, "$1$2-")
    })
    .join("")
}

/**
 * Spacemonkeyn Markdown-vastausnäkymä.
 *
 * ReactMarkdown käsittelee vastauksen tekstinä.
 * Emme käytä dangerouslySetInnerHTML-toimintoa.
 */
function AssistantMarkdown({ content }) {
  return (
    <div className="min-w-0 break-words text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 whitespace-pre-line last:mb-0">
              {children}
            </p>
          ),

          h1: ({ children }) => (
            <h2 className="mb-2 mt-4 text-lg font-bold first:mt-0">
              {children}
            </h2>
          ),

          h2: ({ children }) => (
            <h3 className="mb-2 mt-4 text-base font-bold first:mt-0">
              {children}
            </h3>
          ),

          h3: ({ children }) => (
            <h4 className="mb-2 mt-3 font-bold first:mt-0">
              {children}
            </h4>
          ),

          ul: ({ children }) => (
            <ul className="mb-3 list-disc space-y-1 pl-6 last:mb-0">
              {children}
            </ul>
          ),

          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1 pl-6 last:mb-0">
              {children}
            </ol>
          ),

          li: ({ children }) => (
            <li className="pl-1">{children}</li>
          ),

          strong: ({ children }) => (
            <strong className="font-bold">
              {children}
            </strong>
          ),

          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-2 border-[var(--wood-accent)] pl-3 text-[var(--wood-muted)]">
              {children}
            </blockquote>
          ),

          pre: ({ children }) => (
            <pre className="my-3 max-w-full overflow-x-auto rounded-lg border border-[var(--wood-border)] p-3 text-xs leading-relaxed">
              {children}
            </pre>
          ),

          code: ({ className, children }) => (
            <code
              className={`break-words font-mono text-xs ${
                className || ""
              }`}
            >
              {children}
            </code>
          ),

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--wood-accent)] underline underline-offset-2"
            >
              {children}
            </a>
          ),

          table: ({ children }) => (
            <div className="my-3 max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),

          th: ({ children }) => (
            <th className="border border-[var(--wood-border)] p-2 font-bold">
              {children}
            </th>
          ),

          td: ({ children }) => (
            <td className="border border-[var(--wood-border)] p-2 align-top">
              {children}
            </td>
          ),
        }}
      >
        {normalizeAssistantMarkdown(content)}
      </ReactMarkdown>
    </div>
  )
}

function SourceFiles({ files }) {
  if (!Array.isArray(files) || files.length === 0) {
    return null
  }

  return (
    <div className="space-y-2 text-xs text-[var(--wood-muted)]">
      <p className="font-semibold">
        Tutkitut tiedostot
      </p>

      {files.map((file, index) => (
        <p
          key={`${file.filePath}-${index}`}
          className="break-all"
        >
          {file.filePath}
          {file.truncated ? " (luettu osittain)" : ""}
        </p>
      ))}
    </div>
  )
}

function AnalysisDetails({ analysis }) {
  if (!analysis) return null

  const hasDetails =
    analysis.verifiedSources?.length ||
    analysis.dependencySources?.length ||
    analysis.unresolvedDependencies?.length ||
    analysis.missingSymbols?.length ||
    analysis.inspectedFiles?.length ||
    analysis.warning

  if (!hasDetails) return null

  return (
    <details className="mt-3 rounded-xl border border-[var(--wood-border)] p-3">
      <summary className="cursor-pointer text-xs text-[var(--wood-muted)]">
        Näytä lähdekoodin tarkistustiedot
      </summary>

      <div className="mt-3 space-y-3">
        <VerifiedSourcePanel
          sources={analysis.verifiedSources || []}
        />

        <DependencyInspector
          sources={analysis.dependencySources || []}
          unresolved={analysis.unresolvedDependencies || []}
        />

        <SourceFiles
          files={analysis.inspectedFiles}
        />

        {analysis.missingSymbols?.length > 0 && (
          <p className="text-xs text-[var(--wood-muted)]">
            Todentamatta:{" "}
            {analysis.missingSymbols.join(", ")}
          </p>
        )}

        {analysis.warning && (
          <p className="text-xs text-[var(--wood-muted)]">
            {analysis.warning}
          </p>
        )}
      </div>
    </details>
  )
}

function PlanDetails({ plan }) {
  if (!plan) return null

  return (
    <div className="mt-3 space-y-2 text-xs text-[var(--wood-muted)]">
      <p>
        Kyseessä on suunnitelma.
        Pelin tiedostoja ei muutettu.
      </p>

      {Array.isArray(plan.files) &&
        plan.files.length > 0 && (
          <details className="rounded-xl border border-[var(--wood-border)] p-3">
            <summary className="cursor-pointer">
              Näytä ehdotetut tiedostomuutokset
            </summary>

            <div className="mt-3 space-y-2">
              {plan.files.map((file, index) => (
                <div
                  key={`${file.filePath}-${index}`}
                >
                  <p className="break-all font-semibold">
                    {file.filePath}
                  </p>

                  {file.reason && (
                    <p>{file.reason}</p>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
    </div>
  )
}

function ImageDetails({ result }) {
  if (!result) return null

  return (
    <div className="mt-3 text-xs text-[var(--wood-muted)]">
      {result.width && result.height && (
        <p>
          Kuvan koko: {result.width} × {result.height} px
        </p>
      )}

      {result.preview && (
        <div className="mt-2 space-y-1">
          <p>Uusi esikatselutiedosto:</p>

          <p className="break-all font-mono text-[var(--wood-text)]">
            {result.preview}
          </p>

          <p>
            Alkuperäinen kuva säilytettiin.
          </p>
        </div>
      )}
    </div>
  )
}

export default function HearthwoodDevStudio() {
  const [messages, setMessages] = useState(
    INITIAL_MESSAGES,
  )

  const [input, setInput] = useState("")
  const [thinking, setThinking] = useState(false)

  const messagesEndRef = useRef(null)
  const nextIdRef = useRef(2)
  const sendingRef = useRef(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    })
  }, [messages, thinking])

  function createMessage(role, content, extra = {}) {
    return {
      id: nextIdRef.current++,
      role,
      content,
      ...extra,
    }
  }

  async function postJson(endpoint, body) {
    const response = await fetch(
      `${API_URL}/hearthwood-dev/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    )

    let result

    try {
      result = await response.json()
    } catch {
      throw new Error(
        "Palvelin ei palauttanut kelvollista vastausta.",
      )
    }

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error ||
        "Spacemonkey ei pystynyt käsittelemään pyyntöä.",
      )
    }

    return result
  }

  async function runAssistant(text) {
    const routeResult = await postJson("route", {
      prompt: text,
    })

    const task = routeToExecutableTask(
      text,
      routeResult,
    )

    if (!task) {
      const content = routeResult.requiresApproval
        ? "Tämä toiminto vaatii erillisen hyväksynnän, eikä sitä suoritettu."
        : routeResult.matched
          ? "Tunnistin tehtävän, mutta siihen ei vielä ole käytettävissä suoritettavaa työkalua."
          : "En vielä tunnistanut sopivaa työkalua tähän pyyntöön. Voin tällä hetkellä tutkia koodia, laatia muutossuunnitelmia ja tehdä rajattuja kuvatoimintoja."

      setMessages(previous => [
        ...previous,
        createMessage("assistant", content),
      ])

      return
    }

    const result = await postJson(
      task.endpoint,
      task.body,
    )

    if (task.endpoint === "analyze") {
      setMessages(previous => [
        ...previous,
        createMessage(
          "assistant",
          result.answer ||
            "Tutkin lähdekoodia, mutta vastausteksti puuttui.",
          {
            analysis: result,
          },
        ),
      ])

      return
    }

    if (task.endpoint === "plan") {
      setMessages(previous => [
        ...previous,
        createMessage(
          "assistant",
          result.explanation ||
            "Laadin muutossuunnitelman.",
          {
            plan: result,
          },
        ),
      ])

      return
    }

    if (task.endpoint === "image") {
      const content = result.preview
        ? "Käsittelin kuvan ja tallensin uuden version erilliseen tiedostoon."
        : "Tarkistin kuvan tiedot."

      setMessages(previous => [
        ...previous,
        createMessage(
          "assistant",
          content,
          {
            imageResult: result,
          },
        ),
      ])
    }
  }

  async function sendMessage(event) {
    event?.preventDefault()

    const text = input.trim()

    if (!text || sendingRef.current) {
      return
    }

    sendingRef.current = true
    setThinking(true)
    setInput("")

    setMessages(previous => [
      ...previous,
      createMessage("user", text),
    ])

    try {
      await runAssistant(text)
    } catch (error) {
      setMessages(previous => [
        ...previous,
        createMessage(
          "assistant",
          `Tehtävä epäonnistui: ${error.message}`,
          {
            error: true,
          },
        ),
      ])
    } finally {
      sendingRef.current = false
      setThinking(false)
    }
  }

  function handleKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-7rem)] min-h-[500px] max-w-6xl flex-col gap-4 p-4 text-[var(--wood-text)]">
      <header className="flex items-center gap-3 rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)] p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[var(--wood-border)]">
          <SpacemonkeyIcon />
        </div>

        <div>
          <h1 className="text-lg font-bold">
            Spacemonkey
          </h1>

          <p className="text-xs text-[var(--wood-muted)]">
            Hearthwood Dev Studio · Älykäs avustaja
          </p>
        </div>
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--wood-border)] bg-[var(--wood-panel)]">
        <div
          className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`max-w-[92%] rounded-2xl border p-4 sm:max-w-[80%] ${
                  message.role === "user"
                    ? "border-[var(--wood-accent)] bg-[var(--wood-accent)]/10"
                    : "border-[var(--wood-border)] bg-[var(--wood-bg)]"
                }`}
              >
                <p className="mb-2 text-xs font-semibold text-[var(--wood-muted)]">
                  {message.role === "user"
                    ? "Sinä"
                    : "Spacemonkey"}
                </p>

                {message.role === "user" || message.error ? (
                  <p
                    className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
                      message.error ? "text-red-400" : ""
                    }`}
                  >
                    {message.content}
                  </p>
                ) : (
                  <AssistantMarkdown content={message.content} />
                )}

                {message.analysis && (
                  <AnalysisDetails
                    analysis={message.analysis}
                  />
                )}

                {message.plan && (
                  <PlanDetails
                    plan={message.plan}
                  />
                )}

                {message.imageResult && (
                  <ImageDetails
                    result={message.imageResult}
                  />
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-[var(--wood-border)] p-4 text-sm text-[var(--wood-muted)]">
                Spacemonkey työskentelee...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={sendMessage}
          className="border-t border-[var(--wood-border)] p-4"
        >
          <div className="flex items-end gap-3 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3 focus-within:border-[var(--wood-accent)]">
            <textarea
              value={input}
              onChange={event =>
                setInput(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Mitä tehdään Hearthwoodissa?"
              rows={3}
              disabled={thinking}
              aria-label="Viesti Spacemonkeylle"
              className="min-h-[72px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-[var(--wood-muted)]"
            />

            <button
              type="submit"
              disabled={!input.trim() || thinking}
              className="rounded-xl bg-[var(--wood-accent)] px-5 py-3 text-sm font-bold text-[#17120c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Lähetä
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
