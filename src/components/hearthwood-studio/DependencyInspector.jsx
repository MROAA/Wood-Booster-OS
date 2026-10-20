
/**
 * Hearthwood Dev Studio
 * Dependency Inspector
 *
 * Näyttää Source Intelligence V2:n
 * löytämät lähdekoodiriippuvuudet.
 *
 * Read-only.
 */

export default function DependencyInspector({
  sources = [],
  unresolved = [],
}) {
  const dependencies = Array.isArray(sources)
    ? sources.filter(
        item =>
          item &&
          typeof item.symbol === "string" &&
          typeof item.filePath === "string",
      )
    : []

  const missing = Array.isArray(unresolved)
    ? unresolved.filter(
        item =>
          item &&
          typeof item.symbol === "string",
      )
    : []

  if (!dependencies.length && !missing.length) {
    return null
  }

  return (
    <section className="mt-4 rounded-xl border border-[var(--wood-border)] p-4">

      <h3 className="text-sm font-bold text-[var(--wood-accent)]">
        Source Intelligence — Riippuvuudet
      </h3>

      <p className="mt-2 text-xs text-[var(--wood-muted)]">
        Hearthwoodin lähdekoodista löydetyt
        riippuvuudet ja niiden määritelmäkatkelmat.
        Katkelma ei välttämättä sisällä koko toteutusta.
      </p>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span>
          Löydetty: {dependencies.length}
        </span>

        <span>
          Selvittämättä: {missing.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {dependencies.map((item, index) => (
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

            <div className="space-y-3 p-3">
              <div className="text-xs text-[var(--wood-muted)]">
                Tyyppi:{" "}
                {item.kind === "import"
                  ? "Importattu riippuvuus"
                  : "Paikallinen määritelmä"}
              </div>

              {item.origin && (
                <div className="break-all text-xs text-[var(--wood-muted)]">
                  Lähtötiedosto: {item.origin}
                </div>
              )}

              {typeof item.excerpt === "string" &&
              item.excerpt.trim() ? (
                <pre className="overflow-x-auto whitespace-pre rounded-lg bg-[#101410] p-3 text-xs leading-relaxed text-[#d6e7d6]">
                  <code>{item.excerpt}</code>
                </pre>
              ) : (
                <p className="text-xs text-[var(--wood-muted)]">
                  Lähdekoodikatkelmaa ei ole saatavilla.
                </p>
              )}

              <p className="text-xs text-[var(--wood-muted)]">
                {item.partial
                  ? "Katkelma on katkaistu."
                  : "Lähdekoodikatkelma löytyi. Koko määritelmän täydellisyyttä ei ole varmistettu."}
              </p>
            </div>
          </details>
        ))}
      </div>

      {missing.length > 0 && (
        <div className="mt-4 rounded-lg border border-[var(--wood-border)] p-3">
          <h4 className="text-xs font-bold text-[var(--wood-accent)]">
            SELVITTÄMÄTTÖMÄT RIIPPUVUUDET
          </h4>

          <div className="mt-3 space-y-3">
            {missing.map((item, index) => (
              <div
                key={`${item.symbol}-${index}`}
                className="text-xs"
              >
                <div className="font-mono font-semibold">
                  {item.symbol}
                </div>

                {item.filePath && (
                  <div className="mt-1 break-all text-[var(--wood-muted)]">
                    {item.filePath}
                  </div>
                )}

                {item.reason && (
                  <div className="mt-1 text-[var(--wood-muted)]">
                    {item.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-[var(--wood-muted)]">
        Riippuvuustiedot perustuvat lähdekoodista
        poimittuihin katkelmiin, eivät tekoälyn
        generoimiin koodiesimerkkeihin.
      </p>
    </section>
  )
}
