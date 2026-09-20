import DiffView from "../devstudio/DiffView"

const STATUS_DISPLAY = {

  draft: { icon: "◌", label: "Odottaa hyväksyntää", className: "text-[var(--wood-muted)]" },

  approved: { icon: "◌", label: "Hyväksytty", className: "text-[var(--wood-accent)]" },

  rejected: { icon: "✗", label: "Hylätty", className: "text-red-400" },

  written: { icon: "✓", label: "Kirjoitettu levylle", className: "text-emerald-400" },

  write_failed: { icon: "✗", label: "Kirjoitus epäonnistui", className: "text-red-400" },

  conflict: { icon: "⚠", label: "Tiedosto muuttunut", className: "text-amber-400" },

}

const TEST_STATUS_DISPLAY = {

  passed: { icon: "✓", label: "Testi läpäisi", className: "text-emerald-400" },

  failed: { icon: "✗", label: "Testi epäonnistui", className: "text-red-400" },

  timeout: { icon: "⏱", label: "Testi aikakatkaistiin", className: "text-amber-400" },

  error: { icon: "⚠", label: "Tarkistus epäonnistui", className: "text-amber-400" },

  skipped: { icon: "—", label: "Ei toiminnallista testiä", className: "text-[var(--wood-muted)]" },

}

/*
 * Read-only ikkuna, jonka DevChatPanel.jsx avaa
 * (useDesktop().openApp("devverificationviewer", ...)) kun luonnos
 * on valmis - näyttää saman tiedon kuin chatin kupla, mutta omassa
 * ikkunassaan työpöydällä. Ei koskaan muokkaa mitään - pelkkä katselu.
 */
function VerificationResultViewer({ draft }) {

  if (!draft) {

    return (

      <div className="desktop-app-scroll p-6 text-sm text-[var(--wood-muted)]">
        Ei tarkistustulosta näytettäväksi.
      </div>

    )

  }

  const statusDisplay = STATUS_DISPLAY[draft.status]

  const testDisplay = TEST_STATUS_DISPLAY[draft.testStatus]

  return (

    <div className="desktop-app-scroll p-5 space-y-4 text-[var(--wood-text)]">

      <div>

        <div className="text-lg font-bold">{draft.title || "Koodimuutos"}</div>

        <div className="text-xs text-[var(--wood-muted)] mt-1">{draft.filePath}</div>

      </div>

      {
        statusDisplay && (
          <div className={`text-sm ${statusDisplay.className}`}>
            {statusDisplay.icon} {statusDisplay.label}
          </div>
        )
      }

      {
        draft.explanation && (
          <div className="text-sm leading-relaxed">{draft.explanation}</div>
        )
      }

      <div>
        <div className="text-xs uppercase tracking-wide text-[var(--wood-muted)] mb-2">Diff</div>
        <DiffView diff={draft.diff} filePath={draft.filePath} />
      </div>

      {
        testDisplay && (

          <div>

            <div className="text-xs uppercase tracking-wide text-[var(--wood-muted)] mb-2">
              Tarkistustesti
            </div>

            <div className={`text-sm ${testDisplay.className}`}>
              {testDisplay.icon} {testDisplay.label}
            </div>

            {
              draft.testStatus === "skipped" && draft.testSkippedReason && (
                <div className="text-xs text-[var(--wood-muted)] mt-1">
                  {draft.testSkippedReason}
                </div>
              )
            }

            {
              draft.testCode && (
                <pre
                  className="
                    wood-scroll
                    mt-2
                    max-h-48
                    overflow-auto
                    rounded-lg
                    border
                    border-[var(--wood-border)]
                    bg-[var(--wood-bg)]
                    p-3
                    text-xs
                    leading-relaxed
                    whitespace-pre-wrap
                  "
                >
                  {draft.testCode}
                </pre>
              )
            }

            {
              draft.testOutput && (
                <pre
                  className="
                    wood-scroll
                    mt-2
                    max-h-48
                    overflow-auto
                    rounded-lg
                    border
                    border-[var(--wood-border)]
                    bg-[var(--wood-bg)]
                    p-3
                    text-xs
                    leading-relaxed
                    whitespace-pre-wrap
                    text-[var(--wood-muted)]
                  "
                >
                  {draft.testOutput}
                </pre>
              )
            }

          </div>

        )
      }

    </div>

  )

}

export default VerificationResultViewer
