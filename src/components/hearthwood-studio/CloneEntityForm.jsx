import { useState } from "react"

import { apiGet } from "../../api/client"

import { usePatchPreview } from "./usePatchPreview"
import PatchPreviewPanel from "./PatchPreviewPanel"

/*
 * "Uuden entiteetin luonti (kloonaus)" - Marcin PRD:n mukaan sisällön
 * lisääminen on lähinnä "clone-existing + edit", ei tyhjästä
 * kirjoittamista. Käyttää samaa addKey-op:ia jonka
 * hearthwood-apply-edit.mjs jo tukee (riskModel.js:n MEDIUM-sääntö
 * "an addKey op" laukeaa tästä) - ei siis vaatinut backend-muutosta,
 * vain valmiin entiteetin lähdetekstin (`source`, entityReader.js)
 * uudelleenkäytön uudella id:llä.
 */
function escapeRe(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function buildClonedBlock({ source, oldId, newId, oldName, newName }) {
  let block = source

  const keyPattern = new RegExp(`^(\\s*)(["'])${escapeRe(oldId)}\\2(\\s*:)`)
  block = block.replace(keyPattern, `$1"${newId}"$3`)

  const idFieldPattern = new RegExp(`(\\bid\\s*:\\s*)(["'])${escapeRe(oldId)}\\2`)
  block = block.replace(idFieldPattern, `$1"${newId}"`)

  if (newName && oldName) {
    const namePattern = new RegExp(`(\\bname\\s*:\\s*)(["'])${escapeRe(oldName)}\\2`)
    block = block.replace(namePattern, `$1"${newName}"`)
  }

  return block.trim()
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function CloneEntityForm({ type, entityId, entityDetail, onApplied, onPreviewUrlChange }) {
  const [open, setOpen] = useState(false)
  const [newId, setNewId] = useState("")
  const [newName, setNewName] = useState("")
  const [checkError, setCheckError] = useState("")
  const [checking, setChecking] = useState(false)

  const {
    result,
    applyMode,
    setApplyMode,
    previewing,
    applying,
    errorMessage,
    preview,
    discard,
    apply,
  } = usePatchPreview({ onApplied, onPreviewUrlChange })

  function startOpen() {
    setOpen(true)
    setNewId(entityId ? `${entityId}-kopio` : "")
    setNewName(entityDetail?.name ? `${entityDetail.name} (kopio)` : "")
    setCheckError("")
  }

  async function handlePreview() {
    const candidateId = slugify(newId)

    if (!candidateId) {
      setCheckError("Anna uusi id.")
      return
    }

    if (candidateId === entityId) {
      setCheckError("Uuden id:n täytyy olla eri kuin alkuperäisen.")
      return
    }

    setChecking(true)
    setCheckError("")

    try {
      await apiGet(`/hearthwood-patchbay/entity/${type}/${candidateId}`)
      setCheckError(`Id "${candidateId}" on jo käytössä - valitse toinen.`)
      return
    } catch {
      // 404 == vapaa, jatka
    } finally {
      setChecking(false)
    }

    const block = buildClonedBlock({
      source: entityDetail.source,
      oldId: entityId,
      newId: candidateId,
      oldName: entityDetail.fields?.name?.value,
      newName: newName.trim() || undefined,
    })

    await preview({
      type,
      entityId: candidateId,
      edits: [{ path: [candidateId], op: "addKey", key: candidateId, block }],
    })
  }

  async function handleApply() {
    await apply()
    setOpen(false)
    setNewId("")
    setNewName("")
  }

  if (!entityDetail) {
    return null
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={startOpen}
        className="
          rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs
          text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]
        "
      >
        ⧉ Kloonaa uudeksi
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
        Kloonaa: {entityDetail.name || entityId}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">uusi id</div>
          <input
            value={newId}
            onChange={event => setNewId(event.target.value)}
            className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
          />
        </label>

        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">uusi nimi</div>
          <input
            value={newName}
            onChange={event => setNewName(event.target.value)}
            className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
          />
        </label>
      </div>

      {checkError && <div className="text-xs text-red-300">{checkError}</div>}
      {errorMessage && <div className="text-xs text-red-300">{errorMessage}</div>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={applying}
          className="rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs text-[var(--wood-muted)] hover:text-[var(--wood-text)] disabled:opacity-30"
        >
          Peruuta
        </button>

        <button
          type="button"
          disabled={checking || previewing || !newId.trim()}
          onClick={handlePreview}
          className="
            rounded-full border border-[var(--wood-accent)] bg-[var(--wood-accent)]
            px-3 py-1 text-xs font-medium text-[#17120c] transition-opacity
            disabled:cursor-not-allowed disabled:opacity-30
          "
        >
          {checking ? "Tarkistetaan..." : previewing ? "Esikatsellaan..." : "Esikatsele kloonaus"}
        </button>
      </div>

      <PatchPreviewPanel
        result={result}
        applyMode={applyMode}
        onApplyModeChange={setApplyMode}
        onDiscard={discard}
        onApply={handleApply}
        applying={applying}
      />
    </div>
  )
}

export default CloneEntityForm
