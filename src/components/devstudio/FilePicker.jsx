import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

/*
 * Drop-in korvaaja tavalliselle <input>-kentälle olemassa olevan
 * projektitiedoston polun antamiseen - onChange saa tavallisen React
 * change-eventin, joten kutsupaikat vaihtavat vain elementin tagin.
 * Hakee tiedostolistan kerran mountissa (ks. GET /api/project-files),
 * ei ajanmukaista sen jälkeen.
 */
function FilePicker({ value, onChange, placeholder, extensions }) {

  const [allFiles, setAllFiles] = useState([])

  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {

    let cancelled = false

    apiGet("/project-files")
      .then(files => {

        if (!cancelled) {
          setAllFiles(Array.isArray(files) ? files : [])
        }

      })
      .catch(error => {

        console.error("Tiedostolistan lataus epäonnistui:", error)

      })

    return () => {
      cancelled = true
    }

  }, [])

  const query = (value || "").toLowerCase()

  const suggestions = allFiles
    .filter(file => !extensions || extensions.some(extension => file.endsWith(extension)))
    .filter(file => !query || file.toLowerCase().includes(query))
    .slice(0, 20)

  function selectSuggestion(file) {

    onChange({ target: { value: file } })

    setIsOpen(false)

  }

  return (

    <div className="relative">

      <input
        className="
          w-full
          rounded-xl
          border
          border-[var(--wood-border)]
          bg-[var(--wood-bg)]
          p-3
          text-[var(--wood-text)]
        "
        value={value}
        onChange={onChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        placeholder={placeholder}
      />

      {
        isOpen && suggestions.length > 0 && (

          <ul
            className="
              absolute
              z-10
              mt-1
              max-h-56
              w-full
              overflow-y-auto
              rounded-xl
              border
              border-[var(--wood-border)]
              bg-[var(--wood-panel)]
              text-sm
              text-[var(--wood-text)]
              shadow-lg
            "
          >

            {
              suggestions.map(file => (

                <li key={file}>

                  <button
                    type="button"
                    onMouseDown={() => selectSuggestion(file)}
                    className="
                      block
                      w-full
                      truncate
                      px-3
                      py-1.5
                      text-left
                      hover:bg-[var(--wood-bg)]
                    "
                    title={file}
                  >
                    {file}
                  </button>

                </li>

              ))
            }

          </ul>

        )
      }

    </div>

  )

}

export default FilePicker
