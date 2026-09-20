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

  // The map's own key: quoted ("crownless-throne": .., a kebab-case id
  // that isn't a valid bare identifier) or bare (sealed_hollow_tree: ..,
  // storyLog.js/crownless.js/cinematics.js's "intro" all use plain
  // identifiers) - match either, since which one a given file uses
  // isn't knowable from here. The REPLACEMENT key is always quoted
  // regardless (a slugified newId can itself be kebab-case, invalid as
  // a bare identifier, and a quoted key is valid either way).
  const quotedKeyPattern = new RegExp(`^(\\s*)(["'])${escapeRe(oldId)}\\2(\\s*:)`)
  const bareKeyPattern = new RegExp(`^(\\s*)${escapeRe(oldId)}(\\s*:)`)
  block = quotedKeyPattern.test(block)
    ? block.replace(quotedKeyPattern, `$1"${newId}"$3`)
    : block.replace(bareKeyPattern, `$1"${newId}"$2`)

  const idFieldPattern = new RegExp(`(\\bid\\s*:\\s*)(["'])${escapeRe(oldId)}\\2`)
  block = block.replace(idFieldPattern, `$1"${newId}"`)

  // Marc: "haluan pystyä lisäämään peliin... yksikköjä" (want to add
  // units) - units.js entries are a `unit(id, name, art, cost, role,
  // movePattern, opts)` FACTORY CALL (paths.js's FACTORY_SIGNATURES),
  // not an object literal - there is no `id: "..."` text anywhere in
  // one, so idFieldPattern above never matches, and a cloned unit
  // silently kept its OLD id as this call's own first argument while
  // only the MAP KEY got renamed - two different ids for "the same"
  // entity. Only the factory's own FIRST argument is its id (its
  // later `art` argument can coincidentally hold the identical string,
  // e.g. unit("the-fool", "Mosskit", "the-fool", ...) - replacing
  // every occurrence would wrongly rename that one too).
  const unitFactoryIdPattern = new RegExp(`(\\bunit\\(\\s*)(["'])${escapeRe(oldId)}\\2`)
  block = block.replace(unitFactoryIdPattern, `$1$2${newId}$2`)

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
    setNewId(entityId ? `${entityId}-copy` : "")
    setNewName(entityDetail?.name ? `${entityDetail.name} (copy)` : "")
    setCheckError("")
  }

  async function handlePreview() {
    const candidateId = slugify(newId)

    if (!candidateId) {
      setCheckError("Enter a new id.")
      return
    }

    if (candidateId === entityId) {
      setCheckError("The new id must be different from the original.")
      return
    }

    setChecking(true)
    setCheckError("")

    try {
      await apiGet(`/hearthwood-patchbay/entity/${type}/${candidateId}`)
      setCheckError(`Id "${candidateId}" is already in use - pick another.`)
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
        ⧉ Clone as new
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-[var(--wood-border)] bg-[var(--wood-bg)] p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--wood-muted)]">
        Clone: {entityDetail.name || entityId}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">new id</div>
          <input
            value={newId}
            onChange={event => setNewId(event.target.value)}
            className="h-8 w-full rounded-lg border border-[var(--wood-border)] bg-[var(--wood-panel)] px-2 text-xs text-[var(--wood-text)] outline-none focus:border-[var(--wood-accent)]"
          />
        </label>

        <label className="space-y-1">
          <div className="text-[10px] text-[var(--wood-muted)]">new name</div>
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
          Cancel
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
          {checking ? "Checking..." : previewing ? "Previewing..." : "Preview clone"}
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
