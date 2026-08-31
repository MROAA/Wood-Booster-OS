import { useState } from "react"

/*
 * Aina näkyvä esikatselu. `previewUrl`-propin ollessa asetettu (MEDIUM
 * preview+confirm, ennen kirjoitusta - startPreview() applyPatch.js:ssä)
 * näytetään se eristetty Vite-esikatselu; muuten elävä /heartwood
 * (Vite HMR päivittää sen sovelletun muutoksen jälkeen automaattisesti).
 * reloadKey pakottaa iframen uudelleenlatauksen kun Marc soveltaa
 * muutoksen - HMR ei aina riitä (R1: kesken oleva taistelu ei näe
 * muutosta ennen seuraavaa taistelua).
 */
function heartwoodPathFor(previewUrl) {
  // computePreviewTarget() (previewServer.js) infers a route from the
  // changed files' import graph - it only resolves page/component
  // files, so a Hearthwood *data* file (enemies.js etc.) falls back to
  // the preview server's root ("/") rather than /heartwood. Every
  // Patchbay preview is Hearthwood by definition, so force the path.
  try {
    return new URL("/heartwood", previewUrl).toString()
  } catch {
    return previewUrl
  }
}

function LivePreviewPane({ previewUrl, reloadKey }) {
  const [manualReloadKey, setManualReloadKey] = useState(0)

  const src = previewUrl ? heartwoodPathFor(previewUrl) : "/heartwood"

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 flex items-center justify-between gap-2 border-b border-[var(--wood-border)] px-4 py-3">
        <div className="text-xs text-[var(--wood-muted)]">
          {previewUrl ? "Esikatselu (ei vielä kirjoitettu levylle)" : "Elävä peli"}
        </div>

        <button
          type="button"
          onClick={() => setManualReloadKey(previous => previous + 1)}
          className="
            rounded-full border border-[var(--wood-border)] px-3 py-1 text-xs
            text-[var(--wood-muted)] hover:border-[var(--wood-accent)] hover:text-[var(--wood-text)]
          "
        >
          ↻ Päivitä
        </button>
      </div>

      <iframe
        key={`${src}-${reloadKey}-${manualReloadKey}`}
        src={src}
        title="Hearthwood-esikatselu"
        className="min-h-0 flex-1 w-full border-0 bg-black"
      />

      <div className="shrink-0 px-4 py-2 text-[11px] text-[var(--wood-muted)]">
        Huom: kesken oleva taistelu ei näytä muutosta - se näkyy vasta seuraavassa taistelussa tai näytöllä.
      </div>
    </div>
  )
}

export default LivePreviewPane
