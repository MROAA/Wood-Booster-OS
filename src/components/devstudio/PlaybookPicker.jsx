import { useState } from "react"

import { PLAYBOOKS, interpolatePlaybookTemplate } from "./playbooks"

/*
 * Valmiit prompt-pohjat "lane"-kohtaisesti (koodi/python), yksittäisten
 * suosikkien (SavedPromptsRow.jsx) rinnalle. Sama onUsePlaybook(text)
 * -sopimus kuin SavedPromptsRow'n onUseSaved - täyttää vain prompt-kentän,
 * ei lähetä mitään automaattisesti.
 */
function PlaybookPicker({ lane, onUsePlaybook }) {

  const [openId, setOpenId] = useState(null)

  const [fieldValues, setFieldValues] = useState({})

  const playbooks = PLAYBOOKS.filter(playbook => playbook.lane === lane)

  const openPlaybook = playbooks.find(playbook => playbook.id === openId)

  function selectPlaybook(playbook) {

    if (openId === playbook.id) {
      setOpenId(null)
      return
    }

    setOpenId(playbook.id)

    setFieldValues({})

  }

  function usePlaybook() {

    const interpolated = interpolatePlaybookTemplate(openPlaybook.template, fieldValues)

    onUsePlaybook(interpolated)

    setOpenId(null)

    setFieldValues({})

  }

  const allFieldsFilled = openPlaybook
    ? openPlaybook.fields.every(field => fieldValues[field.key]?.trim())
    : false

  return (

    <div className="space-y-2">

      <div className="flex flex-wrap items-center gap-1.5">

        {
          playbooks.map(playbook => (

            <button
              key={playbook.id}
              type="button"
              onClick={() => selectPlaybook(playbook)}
              className={`
                rounded-full
                border
                px-2.5
                py-1
                text-xs
                transition-colors
                ${
                  openId === playbook.id
                    ? "border-[var(--wood-accent)] text-[var(--wood-text)]"
                    : "border-[var(--wood-border)] text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]"
                }
              `}
            >
              📋 {playbook.label}
            </button>

          ))
        }

      </div>

      {
        openPlaybook && (

          <div
            className="
              space-y-2
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-3
            "
          >

            <p className="text-xs text-[var(--wood-muted)]">{openPlaybook.description}</p>

            {
              openPlaybook.fields.map(field => (

                <label key={field.key} className="block text-xs text-[var(--wood-muted)]">

                  {field.label}

                  <input
                    value={fieldValues[field.key] || ""}
                    onChange={
                      event => setFieldValues(previous => ({
                        ...previous,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="
                      mt-1
                      w-full
                      rounded-lg
                      border
                      border-[var(--wood-border)]
                      bg-[var(--wood-panel)]
                      px-2.5
                      py-1.5
                      text-xs
                      text-[var(--wood-text)]
                      outline-none
                      focus:border-[var(--wood-accent)]
                    "
                  />

                </label>

              ))
            }

            <button
              type="button"
              disabled={!allFieldsFilled}
              onClick={usePlaybook}
              className="
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
              Käytä pohjaa
            </button>

          </div>

        )
      }

    </div>

  )

}

export default PlaybookPicker
