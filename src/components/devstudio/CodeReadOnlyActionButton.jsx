import { useState } from "react"

import FilePicker from "./FilePicker"

import { apiPost } from "../../api/client"

/*
 * Yksi jaettu toteutus "Selitä"/"Katselmoi" -toiminnoille - kummatkin
 * ovat rakenteeltaan identtisiä (FilePicker + lähetys + lataus-/
 * virhe-/tulos-tila), joten yksi parametroitu komponentti kahden
 * lähes-identtisen sijaan. Sama togglenappi-avaa-FilePickerin muoto
 * kuin FileAttachButton.jsx:llä, ei uutta kuviota tälle koodikannalle.
 *
 * Vain luku - ei muokkaa mitään, ei tallenna mitään pakettiin/
 * luonnokseen. Sama malli kuin Python-puolen Selitä/Katselmoi, joilla
 * ei myöskään ole mallinvalintaa - ei lisätä sitä tännekään, ettei
 * epäsymmetria Python-alkuperäisen kanssa kasva.
 */
function CodeReadOnlyActionButton({ icon, label, busyLabel, apiPath, resultField }) {

  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const [filePath, setFilePath] = useState("")

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState("")

  const [result, setResult] = useState("")

  async function submit() {

    if (!filePath.trim()) {

      return

    }

    setBusy(true)

    setError("")

    setResult("")

    try {

      const response = await apiPost(apiPath, { filePath: filePath.trim() })

      setResult(response[resultField])

    } catch (submitError) {

      setError(submitError.message)

    } finally {

      setBusy(false)

    }

  }

  return (

    <div className="space-y-2">

      <button
        type="button"
        onClick={
          () => setIsPickerOpen(open => {

            if (open) {
              setFilePath("")
              setResult("")
              setError("")
            }

            return !open

          })
        }
        className={`
          rounded-full
          border
          px-2.5
          py-1
          text-xs
          transition-colors
          ${
            isPickerOpen
              ? "border-[var(--wood-accent)] text-[var(--wood-text)]"
              : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
          }
        `}
      >
        {icon} {label}
      </button>

      {
        isPickerOpen && (

          <div className="space-y-2">

            <div className="flex items-center gap-2">

              <div className="flex-1">
                <FilePicker
                  value={filePath}
                  onChange={event => setFilePath(event.target.value)}
                  placeholder="Etsi tiedosto…"
                />
              </div>

              <button
                type="button"
                disabled={busy || !filePath.trim()}
                onClick={submit}
                className="
                  shrink-0
                  rounded-full
                  border
                  border-[var(--wood-accent)]
                  px-2.5
                  py-1
                  text-xs
                  text-[var(--wood-text)]
                  transition-opacity
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                  hover:bg-[var(--wood-accent)]
                  hover:text-[var(--wood-bg)]
                "
              >
                {busy ? busyLabel : label}
              </button>

            </div>

            {error && (
              <p className="text-xs text-red-300">{error}</p>
            )}

            {result && (
              <div className="
                rounded-xl
                border
                border-[var(--wood-border)]
                bg-[var(--wood-bg)]
                p-3
                text-xs
                whitespace-pre-wrap
                text-[var(--wood-text)]
              ">
                {result}
              </div>
            )}

          </div>

        )
      }

    </div>

  )

}

export default CodeReadOnlyActionButton
