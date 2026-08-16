/*
 * Diff-näkymä. Diff on jo laskettu palvelimella (ks.
 * devCodeChangeStudio.js:n diffLines-kutsu), joten frontend ei
 * tarvitse omaa diff-kirjastoa - vain väritys valmiille
 * {added, removed, value, count}-paloille.
 *
 * Jaettu DevChatPanel.jsx:n ja VerificationResultViewer.jsx:n kesken,
 * jotta diffin piirtotapa ei voi eriytyä kahdeksi hieman erilaiseksi
 * toteutukseksi.
 */
function DiffView({ diff }) {

  if (!diff || diff.length === 0) {

    return null

  }

  return (

    <pre
      className="
        wood-scroll
        max-h-72
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

      {
        diff.map(
          (chunk, index) => (

            <span
              key={index}
              className={
                chunk.added
                  ? "block bg-emerald-950/40 text-emerald-300"
                  : chunk.removed
                    ? "block bg-red-950/40 text-red-300 line-through"
                    : "block text-[var(--wood-muted)]"
              }
            >

              {
                (
                  chunk.added
                    ? "+ "
                    : chunk.removed
                      ? "- "
                      : "  "
                ) + chunk.value
              }

            </span>

          )
        )
      }

    </pre>

  )

}

export default DiffView
