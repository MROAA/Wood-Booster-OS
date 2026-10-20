
/**
 * Hearthwood Dev Studio
 * Verified Source Panel
 *
 * Näyttää backendin palauttamat alkuperäiset
 * lähdekoodikatkelmat.
 *
 * Ei muokkaa projektin tiedostoja.
 */

export default function VerifiedSourcePanel({
  sources = [],
}) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return null
  }

  return (
    <section className="mt-4 rounded-xl border border-[var(--wood-border)] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[var(--wood-accent)]">
          Todennettu lähdekoodi
        </h3>

        <p className="mt-1 text-xs text-[var(--wood-muted)]">
          Nämä koodikatkelmat on poimittu suoraan
          Hearthwoodin lähdekoodista, ei tekoälyn
          kirjoittamasta vastauksesta.
        </p>
      </div>

      <div className="space-y-3">
        {sources.map((item, index) => (
          <details
            key={`${item.filePath}-${item.symbol}-${index}`}
            className="overflow-hidden rounded-lg border border-[var(--wood-border)]"
          >
            <summary className="cursor-pointer bg-[var(--wood-panel)] p-3">
              <div className="font-mono text-sm font-semibold">
                {item.symbol}
              </div>

              <div className="mt-1 break-all text-xs text-[var(--wood-muted)]">
                {item.filePath}
              </div>
            </summary>

            <div className="p-3">
              <pre className="overflow-x-auto whitespace-pre rounded-lg bg-[#101410] p-3 text-xs leading-relaxed text-[#d6e7d6]">
                <code>{item.source}</code>
              </pre>

              {item.truncated && (
                <p className="mt-2 text-xs text-[var(--wood-muted)]">
                  Huomautus: koko lähdetiedostoa ei
                  ole luettu.
                </p>
              )}
            </div>
          </details>
        ))}
      </div>

      <p className="mt-3 text-xs text-[var(--wood-muted)]">
        Lähdekoodikatkelma on tarkistettavissa.
        Spacemonkeyn sanallinen tulkinta voi silti
        sisältää virheitä.
      </p>
    </section>
  )
}
