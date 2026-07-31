import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom"


import {
  ChatProvider,
} from "./context/ChatContext"


import OSLayout from "./layouts/OSLayout"


import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import Customers from "./pages/Customers"
import Agents from "./pages/Agents"
import Knowledge from "./pages/Knowledge"
import Settings from "./pages/Settings"
import Inventory from "./pages/Inventory"
import AIBrain from "./pages/AIBrain"



function App(){


  return (

    <ChatProvider>

      <BrowserRouter>


        <Routes>


          <Route
            element={
              <OSLayout />
            }
          >


            <Route
              path="/"
              element={
                <Dashboard />
              }
            />


            <Route
              path="/projects"
              element={
                <Projects />
              }
            />


            <Route
              path="/customers"
              element={
                <Customers />
              }
            />


            <Route
              path="/agents"
              element={
                <Agents />
              }
            />


            <Route
              path="/knowledge"
              element={
                <Knowledge />
              }
            />


            <Route
              path="/settings"
              element={
                <Settings />
              }
            />


            <Route
              path="/inventory"
              element={
                <Inventory />
              }
            />


            <Route
              path="/ai-brain"
              element={
                <AIBrain />
              }
            />


          </Route>


        </Routes>


      </BrowserRouter>


    </ChatProvider>

  )

}


export default App
