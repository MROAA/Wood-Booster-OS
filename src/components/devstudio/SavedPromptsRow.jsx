import { useEffect, useState } from "react"

import { apiGet, apiPost, apiDelete } from "../../api/client"

/*
 * Kompakti suosikkirivi Dev Studion prompt-kenttien yläpuolelle - ei
 * korvaa/muokkaa olemassa olevaa syöttökenttää, vain lisää pienen rivin
 * sen viereen. "lane" erottelee kumman välilehden suosikkeja näytetään
 * ("koodi" tai "python", ks. server/routes/savedPrompts.js).
 */
function SavedPromptsRow({ lane, currentPrompt, onUseSaved }) {

  const [savedPrompts, setSavedPrompts] = useState([])

  const [isSaving, setIsSaving] = useState(false)

  const [newLabel, setNewLabel] = useState("")

  useEffect(() => {

    let cancelled = false

    apiGet(`/saved-prompts?lane=${lane}`)
      .then(items => {

        if (!cancelled) {
          setSavedPrompts(Array.isArray(items) ? items : [])
        }

      })
      .catch(error => {

        console.error("Suosikkien lataus epäonnistui:", error)

      })

    return () => {
      cancelled = true
    }

  }, [lane])

  async function saveCurrentPrompt() {

    if (!newLabel.trim() || !currentPrompt.trim()) {
      return
    }

    try {

      const saved = await apiPost("/saved-prompts", {
        lane,
        label: newLabel.trim(),
        prompt: currentPrompt,
      })

      setSavedPrompts(previous => [saved, ...previous])

      setNewLabel("")

      setIsSaving(false)

    } catch (error) {

      console.error("Suosikin tallennus epäonnistui:", error)

    }

  }

  async function deleteSavedPrompt(id) {

    try {

      await apiDelete(`/saved-prompts/${id}`)

      setSavedPrompts(previous => previous.filter(item => item.id !== id))

    } catch (error) {

      console.error("Suosikin poisto epäonnistui:", error)

    }

  }

  return (

    <div className="flex flex-wrap items-center gap-1.5">

      {
        savedPrompts.map(item => (

          <span
            key={item.id}
            className="
              inline-flex
              items-center
              gap-1
              rounded-full
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              px-2.5
              py-1
              text-xs
              text-[var(--wood-text)]
            "
          >

            <button
              type="button"
              onClick={() => onUseSaved(item.prompt)}
              className="hover:text-[var(--wood-accent)]"
              title={item.prompt}
            >
              {item.label}
            </button>

            <button
              type="button"
              onClick={() => deleteSavedPrompt(item.id)}
              className="text-[var(--wood-muted)] hover:text-red-400"
              title="Poista suosikki"
            >
              ×
            </button>

          </span>

        ))
      }

      {
        isSaving ? (

          <span className="inline-flex items-center gap-1">

            <input
              autoFocus
              value={newLabel}
              onChange={event => setNewLabel(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter") {
                  saveCurrentPrompt()
                }
                if (event.key === "Escape") {
                  setIsSaving(false)
                  setNewLabel("")
                }
              }}
              onBlur={() => {
                if (newLabel.trim()) {
                  saveCurrentPrompt()
                } else {
                  setIsSaving(false)
                }
              }}
              placeholder="Otsikko..."
              className="
                w-28
                rounded-full
                border
                border-[var(--wood-accent)]
                bg-[var(--wood-panel)]
                px-2.5
                py-1
                text-xs
                text-[var(--wood-text)]
                outline-none
              "
            />

          </span>

        ) : (

          <button
            type="button"
            disabled={!currentPrompt.trim()}
            onClick={() => setIsSaving(true)}
            className="
              rounded-full
              border
              border-[var(--wood-border)]
              px-2.5
              py-1
              text-xs
              text-[var(--wood-muted)]
              transition-opacity
              disabled:opacity-30
              disabled:cursor-not-allowed
              hover:border-[var(--wood-accent)]
              hover:text-[var(--wood-text)]
            "
          >
            ☆ Tallenna suosikiksi
          </button>

        )
      }

    </div>

  )

}

export default SavedPromptsRow
