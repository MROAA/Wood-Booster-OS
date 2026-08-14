import React from "react"
import ReactDOM from "react-dom/client"

import {
  BrowserRouter,
} from "react-router-dom"


import App from "./App"


import {
  AIProvider,
} from "./context/AIContext"


import {
  ChatProvider,
} from "./context/ChatContext"


import {
  DesktopProvider,
} from "./context/DesktopContext"


import "./index.css"
import "./styles/animations.css"

import {
  initTheme,
} from "./services/theme"


initTheme()





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


              <App />


            </DesktopProvider>


          </ChatProvider>


        </AIProvider>


      </BrowserRouter>


    </React.StrictMode>

  )
