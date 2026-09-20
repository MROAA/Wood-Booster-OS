import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

/*
 * Pieni pudotusvalikko käytettävän Ollama-mallin valintaan. Hakee
 * asennettujen mallien listan kerran mountissa (ks. GET
 * /api/ollama-models), samalla fetch-kerran-mountissa-kaavalla kuin
 * FilePicker.jsx. Oletusvalinta on "käytä oletusta" - value pysyy
 * tyhjänä merkkijonona eikä mitään lähetetä backendille ennen kuin
 * käyttäjä nimenomaan valitsee jonkin listatun mallin, jolloin
 * kutsupaikan oma DEFAULT_MODEL pysyy täysin koskemattomana kaikille
 * jotka eivät koskaan avaa valikkoa.
 */
function ModelPicker({ value, onChange }) {

  const [models, setModels] = useState([])

  useEffect(() => {

    let cancelled = false

    apiGet("/ollama-models")
      .then(names => {

        if (!cancelled) {
          setModels(Array.isArray(names) ? names : [])
        }

      })
      .catch(error => {

        console.error("Mallilistan lataus epäonnistui:", error)

      })

    return () => {
      cancelled = true
    }

  }, [])

  if (models.length === 0) {

    return null

  }

  return (

    <select
      value={value || ""}
      onChange={event => onChange(event.target.value || undefined)}
      className="
        rounded-full
        border
        border-[var(--wood-border)]
        bg-[var(--wood-bg)]
        px-2.5
        py-1
        text-xs
        text-[var(--wood-muted)]
        outline-none
        focus:border-[var(--wood-accent)]
      "
    >

      <option value="">Käytä oletusta</option>

      {
        models.map(name => (
          <option key={name} value={name}>{name}</option>
        ))
      }

    </select>

  )

}

export default ModelPicker
