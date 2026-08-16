import React from "react"
import ReactDOM from "react-dom/client"

import {
  BrowserRouter,
} from "react-router-dom"


import PreviewApp from "./PreviewApp"


import {
  AIProvider,
} from "../context/AIContext"


import {
  ChatProvider,
} from "../context/ChatContext"


import {
  DesktopProvider,
} from "../context/DesktopContext"


import "../index.css"
import "../styles/animations.css"

import {
  initTheme,
} from "../services/theme"


initTheme()




/*
 * Dev Studion live-esikatselun (Phase 7, osa C) oma juurikomponentti.
 * Peilaa tarkasti oikeaa src/main.jsx:ää (sama provider-pino, sama
 * initTheme(), samat CSS-importit) mutta renderöi PreviewAppin - EI
 * koskaan viitattu oikeasta index.html:stä/main.jsx:stä, joten
 * tuotantobuild ei koskaan pakkaa tätä mukaan.
 */


ReactDOM
  .createRoot(
    document.getElementById("root"),
  )
  .render(

    <React.StrictMode>

      <BrowserRouter>


        <AIProvider>


          <ChatProvider>


            <DesktopProvider>


              <PreviewApp />


            </DesktopProvider>


          </ChatProvider>


        </AIProvider>


      </BrowserRouter>


    </React.StrictMode>

  )
