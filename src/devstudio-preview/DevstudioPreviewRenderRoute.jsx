import { Suspense, lazy, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import PreviewErrorBoundary from "./PreviewErrorBoundary"

/*
 * "create"-tyyppisen tiedoston synteettinen esikatselureitti - tiedosto
 * ei vielä ole osa mitään oikeaa App.jsx-reittiä, joten tämä tuo sen
 * suoraan ?file=-parametrin osoittamasta polusta (esikatselu-Viten oma
 * ylikirjoitusplugin tarjoaa sisällön muistista, ei levyltä) ja
 * renderöi sen oletusviennin.
 */
function DevstudioPreviewRenderRoute() {

  const [searchParams] = useSearchParams()

  const file = searchParams.get("file")

  const LazyPreviewComponent = useMemo(() => {

    if (!file) {

      return null

    }

    return lazy(() => import(/* @vite-ignore */ `/${file}`))

  }, [file])

  if (!LazyPreviewComponent) {

    return (
      <div className="p-8 text-sm text-[var(--wood-muted)]">
        Esikatselulle ei annettu tiedostoa.
      </div>
    )

  }

  return (

    <PreviewErrorBoundary>

      <Suspense
        fallback={
          <div className="p-8 text-sm text-[var(--wood-muted)]">Ladataan esikatselua…</div>
        }
      >
        <LazyPreviewComponent />
      </Suspense>

    </PreviewErrorBoundary>

  )

}

export default DevstudioPreviewRenderRoute
