import {
  Routes,
  Route,
} from "react-router-dom"



import OSLayout from "./layouts/OSLayout"



import AIWorkspace from "./pages/AIWorkspace"
import Dashboard from "./pages/Dashboard"
import SystemCenter from "./pages/SystemCenter"
import Projects from "./pages/Projects"
import Customers from "./pages/Customers"
import Knowledge from "./pages/Knowledge"
import Memory from "./pages/Memory"
import CapabilityCenter from "./pages/CapabilityCenter"
import ExecutionCenterV2 from "./pages/ExecutionCenterV2"
import Tools from "./pages/Tools"
import Settings from "./pages/Settings"

import SpacemonkeyDashboard from "./components/spacemonkey/SpacemonkeyDashboard"







function App(){


  return (

    <Routes>


      <Route

        element={
          <OSLayout />
        }

      >




        <Route

          path="/"

          element={
            <AIWorkspace />
          }

        />




        <Route

          path="/dashboard"

          element={
            <Dashboard />
          }

        />




        <Route

          path="/system"

          element={
            <SystemCenter />
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

          path="/knowledge"

          element={
            <Knowledge />
          }

        />




        <Route

          path="/memory"

          element={
            <Memory />
          }

        />




        <Route

          path="/capabilities"

          element={
            <CapabilityCenter />
          }

        />




        <Route

          path="/execution"

          element={
            <ExecutionCenterV2 />
          }

        />




        <Route

          path="/tools"

          element={
            <Tools />
          }

        />




        <Route

          path="/settings"

          element={
            <Settings />
          }

        />




        <Route

          path="/spacemonkey"

          element={
            <SpacemonkeyDashboard />
          }

        />



      </Route>


    </Routes>

  )

}





export default App
