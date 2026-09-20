import { useState } from "react"

import FilePicker from "./FilePicker"

/*
 * "Refaktoroi"/"Debugaa" -painikkeet monitiedostopuolella - näillä ei
 * ole omaa taustajärjestelmää (toisin kuin Python-puolen vastineillaan),
 * vain täyttävät promptikentän valmiiksi ja jättävät koko olemassa
 * olevan suunnitelma→hyväksyntä→generointi→hyväksyntä→kirjoitus-
 * kierron ennalleen - Marcin oma päätös tälle kierrokselle, jotta
 * monitiedostopuolelle ei tule toista, poikkeavaa "ohita suunnitelma"
 * -polkua Python-puolen tapaan.
 *
 * Sama togglenappi-avaa-FilePickerin muoto kuin FileAttachButton.jsx/
 * CodeReadOnlyActionButton.jsx:llä, mutta KORVAA promptin (ei lisää
 * loppuun) - koko pyyntö tulee tästä yhdestä painikkeesta, ei
 * täydennä käyttäjän jo kirjoittamaa tekstiä.
 */
function PromptPrefillButton({ icon, label, buildPrompt, onSetPrompt }) {

  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const [filePath, setFilePath] = useState("")

  function applyPrefill() {

    if (!filePath.trim()) {

      return

    }

    onSetPrompt(buildPrompt(filePath.trim()))

    setFilePath("")

    setIsPickerOpen(false)

  }

  return (

    <div className="space-y-2">

      <button
        type="button"
        onClick={
          () => setIsPickerOpen(open => {

            if (open) {
              setFilePath("")
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
              disabled={!filePath.trim()}
              onClick={applyPrefill}
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
              Käytä
            </button>

          </div>

        )
      }

    </div>

  )

}

export default PromptPrefillButton
