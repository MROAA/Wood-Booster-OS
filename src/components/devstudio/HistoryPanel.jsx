import { useEffect, useState } from "react"

import { apiGet } from "../../api/client"

import DiffView from "./DiffView"

import {
  DRAFT_STATUS_LABELS,
  SET_STATUS_LABELS,
  FILE_STATUS_LABELS,
  TEST_STATUS_DISPLAY,
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

function SingleDraftDetail({ draft }) {

  return (

    <div className="space-y-2">

      <div className="text-xs text-[var(--wood-muted)]">{draft.filePath}</div>

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

function SetDetail({ set }) {

  const visibleFiles = set.files.filter(file => !file.blocked)

  const blockedFiles = set.files.filter(file => file.blocked)

  return (

    <div className="space-y-3">

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

              <span className="text-[10px] text-[var(--wood-muted)]">
                {FILE_STATUS_LABELS[file.status] || file.status}
              </span>

            </div>

            <DiffView diff={file.diff} />

            <TestStatusBlock
              testStatus={file.testStatus}
              testSkippedReason={file.testSkippedReason}
              testOutput={file.testOutput}
            />

          </div>

        ))
      }

    </div>

  )

}

function HistoryEntryRow({ entry, expanded, onToggle }) {

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
            {entry.kind === "set" ? "📦 " : "📄 "}
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
                ? <SetDetail set={entry.raw} />
                : <SingleDraftDetail draft={entry.raw} />
            }

          </div>

        )
      }

    </div>

  )

}

function HistoryPanel() {

  const [entries, setEntries] = useState([])

  const [expandedKey, setExpandedKey] = useState(null)

  const [isLoading, setIsLoading] = useState(true)

  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {

    async function load() {

      setIsLoading(true)

      setErrorMessage("")

      try {

        const [drafts, sets] = await Promise.all([
          apiGet("/dev-drafts"),
          apiGet("/dev-draft-sets"),
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
          entries.map(entry => (

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
            />

          ))
        }

      </div>

    </div>

  )

}

export default HistoryPanel
