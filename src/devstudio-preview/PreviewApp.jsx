import { Routes, Route, useLocation } from "react-router-dom"

import App from "../App"
import OSLayout from "../layouts/OSLayout"
import DevstudioPreviewRenderRoute from "./DevstudioPreviewRenderRoute"

const SYNTHETIC_RENDER_PATH = "/__devstudio-preview/render"

/*
 * Vain kahdelle tapaukselle: synteettinen render-reitti (uusi tiedosto
 * jolla ei vielä ole omaa oikeaa reittiä App.jsx:ssä) tai kaikki muu,
 * jolloin käytetään OIKEAA, muokkaamatonta Appia sellaisenaan. Ei
 * ylläpidetä toista kopiota App.jsx:n ~25 reitin taulukosta täällä -
 * "yksi totuus".
 */
function PreviewApp() {

  const location = useLocation()

  if (location.pathname === SYNTHETIC_RENDER_PATH) {

    return (
      <Routes>
        <Route element={<OSLayout />}>
          <Route path={SYNTHETIC_RENDER_PATH} element={<DevstudioPreviewRenderRoute />} />
        </Route>
      </Routes>
    )

  }

  return <App />

}

export default PreviewApp
