import { useEffect, useState } from "react"

import { apiGet, apiPut } from "../../api/client"

import DiffView from "./DiffView"

import {
  DRAFT_STATUS_LABELS,
  SET_STATUS_LABELS,
  FILE_STATUS_LABELS,
  TEST_STATUS_DISPLAY,
  CHECK_STATUS_LABELS,
} from "./statusLabels"

/*
 * Kaikkien aiempien koodimuutosten selauskysymykseen: chatin
 * vierityshistoria EI säilytä rakenteellisia draft/set-olioita sivun
 * uudelleenlatauksen yli (vain tekstitiivistelmä, ks.
 * chatHistory.js) - Historia lukee siis suoraan samoista
 * Prisma-malleista joita Chat- ja Useampi tiedosto -välilehdet jo
 * käyttävät, jotta vanha muutos löytyy vielä päivienkin päästä (tämä
 * on myös se paikka josta Peruuta-toiminto käynnistyy).
 */

function TestStatusBlock({ testStatus, testSkippedReason, testOutput }) {

  const display = TEST_STATUS_DISPLAY[testStatus]

  if (!display) {

    return null

  }

  return (

    <div className={`text-xs ${display.className}`}>

      {display.icon} {display.label}

      {
        testStatus === "skipped" && testSkippedReason && (
          <span className="text-[var(--wood-muted)]"> — {testSkippedReason}</span>
        )
      }

      {
        (testStatus === "failed" || testStatus === "timeout" || testStatus === "error") &&
        testOutput && (
          <pre
            className="
              wood-scroll
              mt-1
              max-h-40
              overflow-auto
              rounded-lg
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-2
              text-[11px]
              leading-relaxed
              whitespace-pre-wrap
              text-[var(--wood-muted)]
            "
          >
            {testOutput}
          </pre>
        )
      }

    </div>

  )

}

function UnresolvedReferencesBlock({ unresolvedReferences }) {

  if (!unresolvedReferences) {

    return null

  }

  let references

  try {

    references = JSON.parse(unresolvedReferences)

  } catch {

    return null

  }

  if (!Array.isArray(references) || references.length === 0) {

    return null

  }

  return (

    <div className="rounded-lg border border-amber-900 bg-amber-950/20 p-2 text-xs text-amber-300">
      ⚠ Koodi viittasi tiedostoon jota ei löytynyt projektista:
      <ul className="mt-1 list-disc pl-4 font-mono">
        {
          references.map((reference, referenceIndex) => (
            <li key={referenceIndex}>{reference}</li>
          ))
        }
      </ul>
    </div>

  )

}

function RevertButton({ onRevert, busy, label = "Peruuta" }) {

  return (

    <button
      disabled={busy}
      onClick={onRevert}
      className="
        rounded-full
        border
        border-red-900
        px-3
        py-1
        text-xs
        font-medium
        text-red-400
        transition-opacity
        disabled:opacity-30
        disabled:cursor-not-allowed
        hover:bg-red-950/30
      "
    >
      {label}
    </button>

  )

}

function PrLinkBadge({ prUrl, prNumber, label = "PR" }) {

  if (!prUrl) {

    return null

  }

  return (

    <a
      href={prUrl}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-[var(--wood-accent)] underline"
    >
      {label} #{prNumber} ↗
    </a>

  )

}

function CheckStatusBadge({ checkStatus }) {

  const display = CHECK_STATUS_LABELS[checkStatus]

  if (!display) {

    return null

  }

  return (

    <span className={`text-xs ${display.className}`}>
      {display.icon} {display.label}
    </span>

  )

}

function SingleDraftDetail({ draft, onRevert, onRevertPr, onCheckRevertPrStatus, onCheckPrStatus, busy }) {

  return (

    <div className="space-y-2">

      <div className="flex items-center justify-between gap-2">

        <div className="text-xs text-[var(--wood-muted)]">{draft.filePath}</div>

        <div className="flex items-center gap-2">

          {
            draft.status === "written" && (
              <RevertButton onRevert={onRevert} busy={busy} />
            )
          }

          {
            (draft.status === "pr_merged" || draft.status === "pr_revert_failed") && (
              <RevertButton onRevert={onRevertPr} busy={busy} label="Peruuta (uusi PR)" />
            )
          }

          {
            draft.status.startsWith("pr_") && !draft.status.startsWith("pr_revert_") && (

              <>
                <PrLinkBadge prUrl={draft.prUrl} prNumber={draft.prNumber} />
                <CheckStatusBadge checkStatus={draft.checkStatus} />

                {
                  draft.status === "pr_open" && (
                    <button
                      disabled={busy}
                      onClick={onCheckPrStatus}
                      className="
                        rounded-full
                        border
                        border-[var(--wood-border)]
                        px-3
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
                      Tarkista PR:n tila
                    </button>
                  )
                }
              </>

            )
          }

          {
            draft.status.startsWith("pr_revert_") && (

              <>

                <PrLinkBadge prUrl={draft.prUrl} prNumber={draft.prNumber} />

                <PrLinkBadge prUrl={draft.revertPrUrl} prNumber={draft.revertPrNumber} label="Peruutus-PR" />

                {
                  draft.status === "pr_revert_open" && (
                    <button
                      disabled={busy}
                      onClick={onCheckRevertPrStatus}
                      className="
                        rounded-full
                        border
                        border-[var(--wood-border)]
                        px-3
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
                      Tarkista peruutus-PR:n tila
                    </button>
                  )
                }

              </>

            )
          }

        </div>

      </div>

      {
        draft.explanation && (
          <div className="text-sm leading-relaxed">{draft.explanation}</div>
        )
      }

      <DiffView diff={draft.diff} />

      <TestStatusBlock
        testStatus={draft.testStatus}
        testSkippedReason={draft.testSkippedReason}
        testOutput={draft.testOutput}
      />

    </div>

  )

}

function SetDetail({ set, onRevertFile, onRevertSetPr, onCheckRevertSetPrStatus, onCheckPrStatus, busyFileId, busySet }) {

  const visibleFiles = set.files.filter(file => !file.blocked)

  const blockedFiles = set.files.filter(file => file.blocked)

  return (

    <div className="space-y-3">

      <div className="flex items-center gap-2">

        {
          set.status.startsWith("pr_") && !set.status.startsWith("pr_revert_") && (

            <>
              <PrLinkBadge prUrl={set.prUrl} prNumber={set.prNumber} />
              <CheckStatusBadge checkStatus={set.checkStatus} />

              {
                set.status === "pr_open" && (
                  <button
                    disabled={busySet}
                    onClick={onCheckPrStatus}
                    className="
                      rounded-full
                      border
                      border-[var(--wood-border)]
                      px-3
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
                    Tarkista PR:n tila
                  </button>
                )
              }
            </>

          )
        }

        {
          set.status.startsWith("pr_revert_") && (

            <>

              <PrLinkBadge prUrl={set.prUrl} prNumber={set.prNumber} />

              <PrLinkBadge prUrl={set.revertPrUrl} prNumber={set.revertPrNumber} label="Peruutus-PR" />

              {
                set.status === "pr_revert_open" && (
                  <button
                    disabled={busySet}
                    onClick={onCheckRevertSetPrStatus}
                    className="
                      rounded-full
                      border
                      border-[var(--wood-border)]
                      px-3
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
                    Tarkista peruutus-PR:n tila
                  </button>
                )
              }

            </>

          )
        }

        {
          (set.status === "pr_merged" || set.status === "pr_revert_failed") && (
            <RevertButton onRevert={onRevertSetPr} busy={busySet} label="Peruuta (uusi PR)" />
          )
        }

      </div>

      {
        blockedFiles.length > 0 && (
          <div className="space-y-1">
            {
              blockedFiles.map(file => (
                <div key={file.id} className="text-xs text-red-400">
                  Estetty: {file.filePath} ({file.blockedCode})
                </div>
              ))
            }
          </div>
        )
      }

      {
        visibleFiles.map(file => (

          <div
            key={file.id}
            className="
              rounded-lg
              border
              border-[var(--wood-border)]
              bg-[var(--wood-bg)]
              p-3
              space-y-2
            "
          >

            <div className="flex items-center justify-between gap-2">

              <span className="font-mono text-xs text-[var(--wood-text)]">
                {file.action === "create" ? "+ " : "~ "}
                {file.filePath}
              </span>

              <div className="flex items-center gap-2 shrink-0">

                <span className="text-[10px] text-[var(--wood-muted)]">
                  {FILE_STATUS_LABELS[file.status] || file.status}
                </span>

                {
                  file.status === "written" && (
                    <RevertButton
                      onRevert={() => onRevertFile(file.id)}
                      busy={busyFileId === file.id}
                    />
                  )
                }

              </div>

            </div>

            <DiffView diff={file.diff} />

            <TestStatusBlock
              testStatus={file.testStatus}
              testSkippedReason={file.testSkippedReason}
              testOutput={file.testOutput}
            />

            <UnresolvedReferencesBlock
              unresolvedReferences={file.unresolvedReferences}
            />

          </div>

        ))
      }

    </div>

  )

}

function HistoryEntryRow({
  entry,
  expanded,
  onToggle,
  onRevertDraft,
  onRevertFile,
  onRevertDraftPr,
  onCheckRevertDraftPrStatus,
  onRevertSetPr,
  onCheckRevertSetPrStatus,
  onCheckDraftPrStatus,
  onCheckSetPrStatus,
  onRevertPythonDraft,
  onRevertPythonDraftPr,
  onCheckRevertPythonDraftPrStatus,
  onCheckPythonDraftPrStatus,
  busyDraftId,
  busyFileId,
  busySetId,
}) {

  return (

    <div
      className="
        rounded-xl
        border
        border-[var(--wood-border)]
        bg-[var(--wood-panel)]
        overflow-hidden
      "
    >

      <button
        onClick={onToggle}
        className="
          w-full
          flex
          items-center
          justify-between
          gap-3
          px-4
          py-3
          text-left
          hover:bg-[var(--wood-card)]
          transition-colors
        "
      >

        <div className="min-w-0 flex-1">

          <div className="text-sm text-[var(--wood-text)] truncate">
            {entry.kind === "set" ? "📦 " : entry.kind === "python-single" ? "🐍 " : "📄 "}
            {entry.headline}
          </div>

          <div className="text-[11px] text-[var(--wood-muted)]">
            {new Date(entry.createdAt).toLocaleString("fi-FI")}
          </div>

        </div>

        <span
          className="
            shrink-0
            rounded-full
            border
            border-[var(--wood-border)]
            px-2.5
            py-0.5
            text-xs
            text-[var(--wood-muted)]
          "
        >
          {
            entry.kind === "set"
              ? SET_STATUS_LABELS[entry.status] || entry.status
              : DRAFT_STATUS_LABELS[entry.status] || entry.status
          }
        </span>

      </button>

      {
        expanded && (

          <div className="border-t border-[var(--wood-border)] p-4">

            {
              entry.kind === "set"
                ? (
                  <SetDetail
                    set={entry.raw}
                    onRevertFile={fileId => onRevertFile(entry.raw.id, fileId)}
                    onRevertSetPr={() => onRevertSetPr(entry.raw.id)}
                    onCheckRevertSetPrStatus={() => onCheckRevertSetPrStatus(entry.raw.id)}
                    onCheckPrStatus={() => onCheckSetPrStatus(entry.raw.id)}
                    busyFileId={busyFileId}
                    busySet={busySetId === entry.raw.id}
                  />
                )
                : entry.kind === "python-single"
                  ? (
                    <SingleDraftDetail
                      draft={entry.raw}
                      onRevert={() => onRevertPythonDraft(entry.raw.id)}
                      onRevertPr={() => onRevertPythonDraftPr(entry.raw.id)}
                      onCheckRevertPrStatus={() => onCheckRevertPythonDraftPrStatus(entry.raw.id)}
                      onCheckPrStatus={() => onCheckPythonDraftPrStatus(entry.raw.id)}
                      busy={busyDraftId === entry.raw.id}
                    />
                  )
                  : (
                    <SingleDraftDetail
                      draft={entry.raw}
                      onRevert={() => onRevertDraft(entry.raw.id)}
                      onRevertPr={() => onRevertDraftPr(entry.raw.id)}
                      onCheckRevertPrStatus={() => onCheckRevertDraftPrStatus(entry.raw.id)}
                      onCheckPrStatus={() => onCheckDraftPrStatus(entry.raw.id)}
                      busy={busyDraftId === entry.raw.id}
                    />
                  )
            }

          </div>

        )
      }

    </div>

  )

}

const ALL_STATUS_LABELS = {
  ...SET_STATUS_LABELS,
  ...DRAFT_STATUS_LABELS,
  ...FILE_STATUS_LABELS,
}

function entrySearchText(entry) {

  const filePaths =
    entry.kind === "set"
      ? entry.raw.files.map(file => file.filePath)
      : [entry.raw.filePath]

  return [entry.headline, ...filePaths]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

}

function entryStatuses(entry) {

  if (entry.kind === "set") {

    return [entry.status, ...entry.raw.files.map(file => file.status)]

  }

  return [entry.status]

}

function HistoryPanel() {

  const [entries, setEntries] = useState([])

  const [expandedKey, setExpandedKey] = useState(null)

  const [isLoading, setIsLoading] = useState(true)

  const [errorMessage, setErrorMessage] = useState("")

  const [busyDraftId, setBusyDraftId] = useState(null)

  const [busyFileId, setBusyFileId] = useState(null)

  const [busySetId, setBusySetId] = useState(null)

  const [bulkChecking, setBulkChecking] = useState(false)

  const [bulkProgress, setBulkProgress] = useState(null)

  const [searchText, setSearchText] = useState("")

  const [statusFilter, setStatusFilter] = useState("")

  const availableStatuses =
    [...new Set(entries.flatMap(entryStatuses))]
      .sort()

  const openEntries = entries.filter(entry => entry.status === "pr_open")

  const filteredEntries =
    entries.filter(entry => {

      const matchesSearch =
        !searchText.trim() ||
        entrySearchText(entry).includes(searchText.trim().toLowerCase())

      const matchesStatus =
        !statusFilter ||
        entryStatuses(entry).includes(statusFilter)

      return matchesSearch && matchesStatus

    })

  function updateEntryRaw(key, raw) {

    setEntries(
      previous =>
        previous.map(
          entry =>
            entry.key === key
              ? { ...entry, raw, status: raw.status }
              : entry,
        ),
    )

  }

  async function revertDraft(draftId) {

    if (!window.confirm("Peruuta tämä muutos ja palauta aiempi tila?")) {

      return

    }

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/dev-drafts/${draftId}/revert`)

      updateEntryRaw(`draft-${draftId}`, draft)

    } catch (error) {

      // Ristiriitatilanteessa (esim. tiedosto muuttunut kirjoituksen
      // jälkeen) reitti palauttaa silti tuoreen tilan JSON-rungossa,
      // mutta apiPut heittää vain tekstiviestin - haetaan tuore tila
      // erikseen, jotta status (esim. "revert_conflict") näkyy oikein.
      try {

        const refreshed = await apiGet(`/dev-drafts/${draftId}`)

        updateEntryRaw(`draft-${draftId}`, refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function revertDraftPr(draftId) {

    if (!window.confirm("Peruuta tämä yhdistetty Pull Request avaamalla uusi, peruuttava PR?")) {

      return

    }

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/dev-drafts/${draftId}/revert-pr`)

      updateEntryRaw(`draft-${draftId}`, draft)

    } catch (error) {

      try {

        const refreshed = await apiGet(`/dev-drafts/${draftId}`)

        updateEntryRaw(`draft-${draftId}`, refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function checkRevertDraftPrStatus(draftId) {

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/dev-drafts/${draftId}/check-revert-pr-status`)

      updateEntryRaw(`draft-${draftId}`, draft)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function revertSetPr(setId) {

    if (!window.confirm("Peruuta tämä yhdistetty Pull Request avaamalla uusi, peruuttava PR?")) {

      return

    }

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/revert-pr`)

      updateEntryRaw(`set-${setId}`, set)

    } catch (error) {

      try {

        const refreshed = await apiGet(`/dev-draft-sets/${setId}`)

        updateEntryRaw(`set-${setId}`, refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function checkRevertSetPrStatus(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/check-revert-pr-status`)

      updateEntryRaw(`set-${setId}`, set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function checkDraftPrStatus(draftId) {

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/dev-drafts/${draftId}/check-pr-status`)

      updateEntryRaw(`draft-${draftId}`, draft)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function checkSetPrStatus(setId) {

    setBusySetId(setId)

    setErrorMessage("")

    try {

      const set = await apiPut(`/dev-draft-sets/${setId}/check-pr-status`)

      updateEntryRaw(`set-${setId}`, set)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusySetId(null)

    }

  }

  async function revertPythonDraft(draftId) {

    if (!window.confirm("Peruuta tämä muutos ja palauta aiempi tila?")) {

      return

    }

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/python-drafts/${draftId}/revert`)

      updateEntryRaw(`python-draft-${draftId}`, draft)

    } catch (error) {

      try {

        const refreshed = await apiGet(`/python-drafts/${draftId}`)

        updateEntryRaw(`python-draft-${draftId}`, refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function revertPythonDraftPr(draftId) {

    if (!window.confirm("Peruuta tämä yhdistetty Pull Request avaamalla uusi, peruuttava PR?")) {

      return

    }

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/python-drafts/${draftId}/revert-pr`)

      updateEntryRaw(`python-draft-${draftId}`, draft)

    } catch (error) {

      try {

        const refreshed = await apiGet(`/python-drafts/${draftId}`)

        updateEntryRaw(`python-draft-${draftId}`, refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function checkRevertPythonDraftPrStatus(draftId) {

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/python-drafts/${draftId}/check-revert-pr-status`)

      updateEntryRaw(`python-draft-${draftId}`, draft)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function checkPythonDraftPrStatus(draftId) {

    setBusyDraftId(draftId)

    setErrorMessage("")

    try {

      const draft = await apiPut(`/python-drafts/${draftId}/check-pr-status`)

      updateEntryRaw(`python-draft-${draftId}`, draft)

    } catch (error) {

      setErrorMessage(error.message)

    } finally {

      setBusyDraftId(null)

    }

  }

  async function checkAllOpenPrs() {

    const targets = entries.filter(entry => entry.status === "pr_open")

    if (targets.length === 0) {

      return

    }

    setBulkChecking(true)

    setErrorMessage("")

    for (let index = 0; index < targets.length; index += 1) {

      setBulkProgress({ current: index + 1, total: targets.length })

      const entry = targets[index]

      if (entry.kind === "set") {

        await checkSetPrStatus(entry.raw.id)

      } else if (entry.kind === "python-single") {

        await checkPythonDraftPrStatus(entry.raw.id)

      } else {

        await checkDraftPrStatus(entry.raw.id)

      }

    }

    setBulkProgress(null)

    setBulkChecking(false)

  }

  async function revertFile(setId, fileId) {

    if (!window.confirm("Peruuta tämä tiedosto ja palauta aiempi tila?")) {

      return

    }

    setBusyFileId(fileId)

    setErrorMessage("")

    try {

      const updatedSet = await apiPut(`/dev-draft-sets/${setId}/files/${fileId}/revert`)

      updateEntryRaw(`set-${setId}`, updatedSet)

    } catch (error) {

      try {

        const refreshed = await apiGet(`/dev-draft-sets/${setId}`)

        updateEntryRaw(`set-${setId}`, refreshed)

      } catch {

        // ei väliä, alla oleva virheviesti riittää

      }

      setErrorMessage(error.message)

    } finally {

      setBusyFileId(null)

    }

  }

  useEffect(() => {

    async function load() {

      setIsLoading(true)

      setErrorMessage("")

      try {

        const [drafts, sets, pythonDrafts] = await Promise.all([
          apiGet("/dev-drafts"),
          apiGet("/dev-draft-sets"),
          apiGet("/python-drafts"),
        ])

        const normalized = [

          ...drafts.map(draft => ({
            key: `draft-${draft.id}`,
            kind: "single",
            createdAt: draft.createdAt,
            status: draft.status,
            headline: draft.title || draft.prompt,
            raw: draft,
          })),

          ...sets.map(set => ({
            key: `set-${set.id}`,
            kind: "set",
            createdAt: set.createdAt,
            status: set.status,
            headline: set.planExplanation || set.prompt,
            raw: set,
          })),

          ...pythonDrafts.map(draft => ({
            key: `python-draft-${draft.id}`,
            kind: "python-single",
            createdAt: draft.createdAt,
            status: draft.status,
            headline: draft.title || draft.prompt,
            raw: draft,
          })),

        ].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        )

        setEntries(normalized)

      } catch (error) {

        setErrorMessage(error.message)

      } finally {

        setIsLoading(false)

      }

    }

    load()

  }, [])

  return (

    <div className="h-full min-h-0 flex flex-col">

      {
        entries.length > 0 && (

          <div
            className="
              shrink-0
              flex
              gap-2
              p-4
              border-b
              border-[var(--wood-border)]
            "
          >

            <input
              value={searchText}
              onChange={event => setSearchText(event.target.value)}
              placeholder="Hae otsikon tai tiedostopolun mukaan..."
              className="
                flex-1
                h-9
                rounded-full
                px-4
                bg-[var(--wood-bg)]
                border
                border-[var(--wood-border)]
                text-xs
                text-[var(--wood-text)]
                placeholder:text-[var(--wood-muted)]
                outline-none
                focus:border-[var(--wood-accent)]
              "
            />

            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className="
                h-9
                rounded-full
                px-3
                bg-[var(--wood-bg)]
                border
                border-[var(--wood-border)]
                text-xs
                text-[var(--wood-text)]
                outline-none
                focus:border-[var(--wood-accent)]
              "
            >
              <option value="">Kaikki tilat</option>
              {
                availableStatuses.map(status => (
                  <option key={status} value={status}>
                    {ALL_STATUS_LABELS[status] || status}
                  </option>
                ))
              }
            </select>

            {
              openEntries.length > 0 && (
                <button
                  disabled={bulkChecking}
                  onClick={checkAllOpenPrs}
                  className="
                    h-9
                    shrink-0
                    rounded-full
                    border
                    border-[var(--wood-border)]
                    px-3
                    text-xs
                    text-[var(--wood-muted)]
                    transition-opacity
                    disabled:opacity-30
                    disabled:cursor-not-allowed
                    hover:border-[var(--wood-accent)]
                    hover:text-[var(--wood-text)]
                  "
                >
                  {
                    bulkChecking
                      ? `Tarkistetaan ${bulkProgress?.current ?? 0}/${bulkProgress?.total ?? openEntries.length}...`
                      : `Tarkista kaikki avoimet PR:t (${openEntries.length})`
                  }
                </button>
              )
            }

          </div>

        )
      }

      <div className="wood-scroll flex-1 min-h-0 overflow-y-auto p-5 space-y-3">

        {
          isLoading && (
            <div className="text-sm text-[var(--wood-muted)]">Ladataan historiaa...</div>
          )
        }

        {
          errorMessage && (
            <div className="text-xs text-red-300">{errorMessage}</div>
          )
        }

        {
          !isLoading && entries.length === 0 && !errorMessage && (
            <div className="text-sm text-[var(--wood-muted)]">
              Ei vielä yhtään ehdotettua muutosta.
            </div>
          )
        }

        {
          !isLoading && entries.length > 0 && filteredEntries.length === 0 && (
            <div className="text-sm text-[var(--wood-muted)]">
              Ei hakua vastaavia muutoksia.
            </div>
          )
        }

        {
          filteredEntries.map(entry => (

            <HistoryEntryRow
              key={entry.key}
              entry={entry}
              expanded={expandedKey === entry.key}
              onToggle={
                () =>
                  setExpandedKey(
                    previous => previous === entry.key ? null : entry.key,
                  )
              }
              onRevertDraft={revertDraft}
              onRevertFile={revertFile}
              onRevertDraftPr={revertDraftPr}
              onCheckRevertDraftPrStatus={checkRevertDraftPrStatus}
              onRevertSetPr={revertSetPr}
              onCheckRevertSetPrStatus={checkRevertSetPrStatus}
              onCheckDraftPrStatus={checkDraftPrStatus}
              onCheckSetPrStatus={checkSetPrStatus}
              onRevertPythonDraft={revertPythonDraft}
              onRevertPythonDraftPr={revertPythonDraftPr}
              onCheckRevertPythonDraftPrStatus={checkRevertPythonDraftPrStatus}
              onCheckPythonDraftPrStatus={checkPythonDraftPrStatus}
              busyDraftId={busyDraftId}
              busyFileId={busyFileId}
              busySetId={busySetId}
            />

          ))
        }

      </div>

    </div>

  )

}

export default HistoryPanel
