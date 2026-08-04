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


import "./index.css"
import "./styles/animations.css"





ReactDOM
  .createRoot(
    document.getElementById("root"),
  )
  .render(

    <React.StrictMode>

      <BrowserRouter>


        <AIProvider>


          <ChatProvider>


            <App />


          </ChatProvider>


        </AIProvider>


      </BrowserRouter>


    </React.StrictMode>

  )
