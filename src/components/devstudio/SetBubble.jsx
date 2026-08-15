import DiffView from "./DiffView"

/*
 * Suunnitelma/tiedostopaketti-kupla. Jaettu komponentti - sama kortti
 * jota käyttää sekä "Useampi tiedosto" -paneeli (MultiFileChatPanel)
 * että jaettu Spacemonkey-chat /koodi-tilassa (ChatPanel). "Yksi
 * totuus": ei kahta kopiota samasta kortista kahdessa paikassa.
 */

const SET_STATUS_LABELS = {

  plan_ready: "Suunnitelma odottaa hyväksyntää",

  draft: "Odottaa hyväksyntää",

  approved: "Hyväksytty",

  rejected: "Hylätty",

  written: "Kirjoitettu levylle",

  partial_write_failed: "Osa epäonnistui",

}

const FILE_STATUS_LABELS = {

  blocked: "Estetty",

  planned: "Suunniteltu",

  generated: "Valmis tarkistettavaksi",

  generate_failed: "Generointi epäonnistui",

  written: "Kirjoitettu",

  write_failed: "Kirjoitus epäonnistui",

  conflict: "Tiedosto muuttunut",

}

const TEST_STATUS_DISPLAY = {

  passed: { icon: "✓", label: "Testi läpäisi", className: "text-emerald-400" },

  failed: { icon: "✗", label: "Testi epäonnistui", className: "text-red-400" },

  timeout: { icon: "⏱", label: "Testi aikakatkaistiin", className: "text-amber-400" },

  error: { icon: "⚠", label: "Tarkistus epäonnistui", className: "text-amber-400" },

  skipped: { icon: "—", label: "Ei toiminnallista testiä", className: "text-[var(--wood-muted)]" },

}

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
          file.blocked && (
            <span className="text-red-400">Estetty: {file.blockedCode}</span>
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

function FileReviewCard({ file }) {

  const testDisplay = TEST_STATUS_DISPLAY[file.testStatus]

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

      <div className="flex items-center justify-between gap-2">

        <span className="font-mono text-xs text-[var(--wood-text)]">
          {file.action === "create" ? "+ " : "~ "}
          {file.filePath}
        </span>

        <span className="text-[10px] text-[var(--wood-muted)]">
          {FILE_STATUS_LABELS[file.status] || file.status}
        </span>

      </div>

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

    </div>

  )

}

function SetBubble({ set, onApprovePlan, onApprove, onReject, onWrite, busy }) {

  const status = set.status

  const visibleFiles = set.files.filter(file => !file.blocked)

  const blockedFiles = set.files.filter(file => file.blocked)

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

            {visibleFiles.map(file => <FileReviewCard key={file.id} file={file} />)}

            <div className="flex gap-2 pt-1">

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
                  (status !== "approved" && status !== "partial_write_failed") || busy
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
                Kirjoita kaikki
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

            </div>

          </div>

        )
      }

    </div>

  )

}

export default SetBubble
