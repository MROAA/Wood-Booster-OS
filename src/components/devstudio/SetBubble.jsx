import { useState } from "react"

import DiffView from "./DiffView"

import { computeDiffDelta } from "./diffDelta"

import { SET_STATUS_LABELS, FILE_STATUS_LABELS, TEST_STATUS_DISPLAY } from "./statusLabels"

import { parseUnresolvedReferences } from "./parseUnresolvedReferences"

/*
 * Suunnitelma/tiedostopaketti-kupla. Jaettu komponentti - sama kortti
 * jota käyttää sekä "Useampi tiedosto" -paneeli (MultiFileChatPanel)
 * että jaettu Spacemonkey-chat /koodi-tilassa (ChatPanel). "Yksi
 * totuus": ei kahta kopiota samasta kortista kahdessa paikassa.
 */

function PlanFileRow({ file }) {

  return (

    <div
      className={`
        rounded-lg
        border
        px-3
        py-2
        text-xs
        ${
          file.blocked
            ? "border-red-900 bg-red-950/20"
            : "border-[var(--wood-border)] bg-[var(--wood-bg)]"
        }
      `}
    >

      <div className="flex items-center justify-between gap-2">

        <span className="font-mono text-[var(--wood-text)]">
          {file.action === "create" ? "+ " : "~ "}
          {file.filePath}
        </span>

        {
          file.blocked ? (
            <span className="text-red-400">Estetty: {file.blockedCode}</span>
          ) : (
            file.status !== "planned" && (
              <span className="text-[10px] text-[var(--wood-muted)]">
                {FILE_STATUS_LABELS[file.status] || file.status}
              </span>
            )
          )
        }

      </div>

      {
        file.reason && (
          <div className="mt-1 text-[var(--wood-muted)]">{file.reason}</div>
        )
      }

    </div>

  )

}

// Multitiedostosuunnitelmassa tiedosto avataan oletuksena auki jos se
// tarvitsee Marcin huomiota heti - kaikki muu pysyy kiinni, koska
// kompakti otsikkorivi (tiedostonimi + tila + rivimäärä) riittää
// kertomaan ettei siihen tarvitse koskea.
function shouldExpandByDefault(file) {

  if (file.status === "conflict") {

    return true

  }

  if (file.testStatus === "vacuous" || file.testStatus === "failed") {

    return true

  }

  if (parseUnresolvedReferences(file.unresolvedReferences).length > 0) {

    return true

  }

  return false

}

function FileReviewCard({ file, onRevise, busy, collapsible }) {

  const testDisplay = TEST_STATUS_DISPLAY[file.testStatus]

  const unresolvedReferences = parseUnresolvedReferences(file.unresolvedReferences)

  const [feedback, setFeedback] = useState("")

  const [isOpen, setIsOpen] = useState(!collapsible || shouldExpandByDefault(file))

  const delta = collapsible ? computeDiffDelta(file.diff) : null

  function submitRevise() {

    if (!feedback.trim()) {

      return

    }

    onRevise(feedback.trim())

    setFeedback("")

  }

  return (

    <div
      className="
        rounded-lg
        border
        border-[var(--wood-border)]
        bg-[var(--wood-bg)]
        p-3
        space-y-2
      "
    >

      <div
        className={`flex items-center justify-between gap-2 ${collapsible ? "cursor-pointer" : ""}`}
        onClick={collapsible ? () => setIsOpen(open => !open) : undefined}
      >

        <span className="font-mono text-xs text-[var(--wood-text)]">
          {file.action === "create" ? "+ " : "~ "}
          {file.filePath}
        </span>

        <div className="flex shrink-0 items-center gap-2">

          {
            collapsible && (delta.added > 0 || delta.removed > 0) && (
              <span className="font-mono text-[10px]">
                {delta.added > 0 && <span className="text-emerald-400">+{delta.added}</span>}
                {delta.added > 0 && delta.removed > 0 && " "}
                {delta.removed > 0 && <span className="text-red-400">-{delta.removed}</span>}
              </span>
            )
          }

          <span className="text-[10px] text-[var(--wood-muted)]">
            {FILE_STATUS_LABELS[file.status] || file.status}
          </span>

          {
            collapsible && (
              <span className="text-[10px] text-[var(--wood-muted)]">{isOpen ? "▴" : "▾"}</span>
            )
          }

        </div>

      </div>

      {
        isOpen && (

          <>

            {
              file.status === "generate_failed" && file.generateError && (
                <div className="text-xs text-red-400">{file.generateError}</div>
              )
            }

            {
              file.status === "write_failed" && file.writeError && (
                <div className="text-xs text-red-400">{file.writeError}</div>
              )
            }

            {
              file.status === "conflict" && (
                <div className="text-xs text-amber-400">
                  Tiedosto on muuttunut suunnitelman luonnin jälkeen.
                </div>
              )
            }

            <DiffView diff={file.diff} />

            {
              testDisplay && (
                <div className={`text-xs ${testDisplay.className}`}>
                  {testDisplay.icon} {testDisplay.label}
                  {
                    file.testStatus === "skipped" && file.testSkippedReason && (
                      <span className="text-[var(--wood-muted)]"> — {file.testSkippedReason}</span>
                    )
                  }
                </div>
              )
            }

            {
              unresolvedReferences.length > 0 && (
                <div className="rounded-lg border border-amber-900 bg-amber-950/20 p-2 text-xs text-amber-300">
                  ⚠ Koodi viittaa tiedostoon jota ei löydy projektista - tarkista ennen hyväksyntää:
                  <ul className="mt-1 list-disc pl-4 font-mono">
                    {
                      unresolvedReferences.map((reference, referenceIndex) => (
                        <li key={referenceIndex}>{reference}</li>
                      ))
                    }
                  </ul>
                </div>
              )
            }

            {
              file.status === "generated" && (

                <div className="space-y-2 pt-1">

                  <textarea
                    value={feedback}
                    onChange={event => setFeedback(event.target.value)}
                    disabled={busy}
                    rows={2}
                    placeholder="Pyydä muutosta tähän tiedostoon, esim. 'käytä eri muuttujan nimeä'"
                    className="
                      w-full
                      rounded-lg
                      border
                      border-[var(--wood-border)]
                      bg-[var(--wood-panel)]
                      p-2
                      text-xs
                      text-[var(--wood-text)]
                      placeholder:text-[var(--wood-muted)]
                      outline-none
                      focus:border-[var(--wood-accent)]
                    "
                  />

                  <button
                    disabled={busy || !feedback.trim()}
                    onClick={submitRevise}
                    className="
                      rounded-full
                      border
                      border-[var(--wood-border)]
                      px-3
                      py-1
                      text-xs
                      font-medium
                      text-[var(--wood-text)]
                      transition-opacity
                      disabled:opacity-30
                      disabled:cursor-not-allowed
                      hover:border-[var(--wood-accent)]
                    "
                  >
                    Pyydä muutosta
                  </button>

                </div>

              )
            }

          </>

        )
      }

    </div>

  )

}

function isPreviewableFile(file) {

  return !file.blocked && Boolean(file.proposedCode) && file.filePath.startsWith("src/")

}

function SetBubble({ set, onApprovePlan, onApprove, onReject, onWrite, onReviseFile, onPreview, onStopPreview, previewing, previewBusy, onCheckPrStatus, onRevertPr, onCheckRevertPrStatus, busy }) {

  const status = set.status

  const visibleFiles = set.files.filter(file => !file.blocked)

  const blockedFiles = set.files.filter(file => file.blocked)

  const hasPreviewableFile = set.files.some(isPreviewableFile)

  return (

    <div
      className="
        max-w-[95%]
        rounded-2xl
        rounded-bl-md
        border
        border-[var(--wood-border)]
        bg-gradient-to-br
        from-[var(--wood-panel)]
        to-[var(--wood-card)]
        p-4
        space-y-3
        text-sm
        text-[var(--wood-text)]
      "
    >

      <div className="flex items-center justify-between gap-2">

        <div className="font-medium">Suunnitelma</div>

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
          {SET_STATUS_LABELS[status] || status}
        </span>

      </div>

      {
        set.planExplanation && (
          <div className="text-sm leading-relaxed">{set.planExplanation}</div>
        )
      }

      {
        set.writeError && (
          <div className="text-xs text-amber-400">{set.writeError}</div>
        )
      }

      {
        status === "plan_ready" ? (

          <div className="space-y-2">

            {
              busy && (
                <div className="text-xs text-[var(--wood-muted)]">
                  {visibleFiles.filter(file => file.status === "generated" || file.status === "generate_failed").length}
                  {" / "}
                  {visibleFiles.length} tiedostoa valmiina
                </div>
              )
            }

            {set.files.map(file => <PlanFileRow key={file.id} file={file} />)}

            <div className="flex gap-2 pt-1">

              <button
                disabled={busy || visibleFiles.length === 0}
                onClick={onApprovePlan}
                className="
                  rounded-full
                  px-4
                  py-1.5
                  text-xs
                  font-medium
                  bg-[var(--wood-accent)]
                  text-[#17120c]
                  transition-opacity
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                  hover:opacity-90
                "
              >
                Hyväksy suunnitelma
              </button>

              <button
                disabled={busy}
                onClick={onReject}
                className="
                  rounded-full
                  px-4
                  py-1.5
                  text-xs
                  font-medium
                  text-[var(--wood-muted)]
                  transition-opacity
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                  hover:text-red-300
                "
              >
                Hylkää
              </button>

            </div>

            {
              visibleFiles.length === 0 && (
                <div className="text-xs text-red-400">
                  Kaikki suunnitellut tiedostot estettiin - pyyntöä ei voi toteuttaa turvallisesti.
                </div>
              )
            }

          </div>

        ) : (

          <div className="space-y-3">

            {
              blockedFiles.length > 0 && (
                <div className="space-y-2">
                  {blockedFiles.map(file => <PlanFileRow key={file.id} file={file} />)}
                </div>
              )
            }

            {
              visibleFiles.map(file => (
                <FileReviewCard
                  key={file.id}
                  file={file}
                  busy={busy}
                  onRevise={feedback => onReviseFile(file.id, feedback)}
                  collapsible={visibleFiles.length > 1}
                />
              ))
            }

            <div className="flex gap-2 pt-1">

              {
                onPreview && (
                  <button
                    disabled={busy || previewBusy || (!previewing && !hasPreviewableFile)}
                    onClick={previewing ? onStopPreview : onPreview}
                    title={
                      hasPreviewableFile
                        ? undefined
                        : "Paketissa ei ole yhtään esikatseltavaa (src/**) tiedostoa."
                    }
                    className="
                      rounded-full
                      px-4
                      py-1.5
                      text-xs
                      font-medium
                      border
                      border-[var(--wood-border)]
                      text-[var(--wood-text)]
                      transition-opacity
                      disabled:opacity-30
                      disabled:cursor-not-allowed
                      hover:border-[var(--wood-accent)]
                    "
                  >
                    {previewing ? "Pysäytä esikatselu" : "Esikatsele"}
                  </button>
                )
              }

              <button
                disabled={status !== "draft" || busy}
                onClick={onApprove}
                className="
                  rounded-full
                  px-4
                  py-1.5
                  text-xs
                  font-medium
                  bg-[var(--wood-accent)]
                  text-[#17120c]
                  transition-opacity
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                  hover:opacity-90
                "
              >
                Hyväksy kaikki
              </button>

              <button
                disabled={
                  (status !== "approved" && status !== "partial_write_failed" && status !== "pr_failed") || busy
                }
                onClick={onWrite}
                className="
                  rounded-full
                  px-4
                  py-1.5
                  text-xs
                  font-medium
                  border
                  border-[var(--wood-accent)]
                  text-[var(--wood-accent)]
                  transition-opacity
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                  hover:bg-[var(--wood-accent)]/10
                "
              >
                Tee Pull Request
              </button>

              <button
                disabled={
                  (status !== "draft" && status !== "approved") || busy
                }
                onClick={onReject}
                className="
                  rounded-full
                  px-4
                  py-1.5
                  text-xs
                  font-medium
                  text-[var(--wood-muted)]
                  transition-opacity
                  disabled:opacity-30
                  disabled:cursor-not-allowed
                  hover:text-red-300
                "
              >
                Hylkää
              </button>

              {
                onRevertPr && (
                  <button
                    disabled={
                      (status !== "pr_merged" && status !== "pr_revert_failed") || busy
                    }
                    onClick={onRevertPr}
                    className="
                      rounded-full
                      px-4
                      py-1.5
                      text-xs
                      font-medium
                      border
                      border-[var(--wood-border)]
                      text-[var(--wood-muted)]
                      transition-opacity
                      disabled:opacity-30
                      disabled:cursor-not-allowed
                      hover:border-red-400
                      hover:text-red-300
                    "
                  >
                    Peruuta (uusi PR)
                  </button>
                )
              }

            </div>

            {
              status.startsWith("pr_") && !status.startsWith("pr_revert_") && (

                <div className="flex items-center gap-2 pt-1">

                  {
                    set.prUrl && (
                      <a
                        href={set.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--wood-accent)] underline"
                      >
                        PR #{set.prNumber} ↗
                      </a>
                    )
                  }

                  {
                    status === "pr_open" && onCheckPrStatus && (
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

                </div>

              )
            }

            {
              status.startsWith("pr_revert_") && (

                <div className="flex items-center gap-2 pt-1">

                  {
                    set.prUrl && (
                      <a
                        href={set.prUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[var(--wood-accent)] underline"
                      >
                        PR #{set.prNumber} ↗
                      </a>
                    )
                  }

                  {
                    set.revertPrUrl && (
                      <a
                        href={set.revertPrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-red-300 underline"
                      >
                        Peruutus-PR #{set.revertPrNumber} ↗
                      </a>
                    )
                  }

                  {
                    status === "pr_revert_open" && onCheckRevertPrStatus && (
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

                </div>

              )
            }

          </div>

        )
      }

    </div>

  )

}

export default SetBubble
