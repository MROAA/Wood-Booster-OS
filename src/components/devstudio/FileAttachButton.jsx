import { useState } from "react"

import FilePicker from "./FilePicker"

/*
 * Pieni "liitä tiedosto" -painike promptin yläpuolelle - täydentää
 * FilePickeriä (joka on rakennettu korvaamaan yksittäinen <input>)
 * lisäämällä valitun polun promptin LOPPUUN sen sijaan että se
 * korvaisi koko promptin. Ei kirjoituskohdistin-tietoisuutta - tälle
 * ei ole ennakkotapausta koodikannassa (ei selectionStart/End-käyttöä
 * missään), joten yksinkertaisin toimiva ratkaisu on liittäminen
 * loppuun, ei tarkka lisäys kohdistimen kohdalle.
 *
 * FilePickerin onChange laukeaa jokaisesta näppäinpainalluksesta,
 * ei vain listasta valittaessa (se on suunniteltu <input>-kentän
 * korvaajaksi, ei erilliseksi valitsimeksi) - siksi liittäminen ei voi
 * tapahtua suoraan onChangessa, vaan vasta erillisestä "Liitä"-
 * napista, samalla tavalla kuin PlaybookPicker vaatii oman
 * "Käytä pohjaa" -painalluksen ennen kuin mitään tapahtuu promptille.
 */
function FileAttachButton({ prompt, onAttach }) {

  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const [filePath, setFilePath] = useState("")

  function attachFile() {

    if (!filePath.trim()) {

      return

    }

    // Promptin syöttökenttä on yksirivinen <input>, ei <textarea> -
    // rivinvaihdot eivät säily siinä (selain siivoaa CR/LF-merkit
    // value-attribuutista), joten erotin on välilyönti, ei "\n\n".
    const separator = prompt.trim() ? " " : ""

    onAttach(`${prompt}${separator}Tiedosto: ${filePath.trim()}`)

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
        📎 Liitä tiedosto
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
              onClick={attachFile}
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
              Liitä
            </button>

          </div>

        )
      }

    </div>

  )

}

export default FileAttachButton
