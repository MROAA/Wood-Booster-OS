import {
  Routes,
  Route,
} from "react-router-dom"


import OSLayout from "./layouts/OSLayout"

import Spacemonkey from "./pages/Spacemonkey"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import ProjectDetails from "./pages/ProjectDetails"
import Customers from "./pages/Customers"
import CustomerDetails from "./pages/CustomerDetails"
import Inventory from "./pages/Inventory"
import Purchases from "./pages/Purchases"
import Knowledge from "./pages/Knowledge"
import KnowledgeDocumentDetails from "./pages/KnowledgeDocumentDetails"
import Memory from "./pages/Memory"
import Agents from "./pages/Agents"
import Settings from "./pages/Settings"
import SystemPulse from "./pages/SystemPulse"
import SpacemonkeyBrain from "./pages/SpacemonkeyBrain"




function App() {


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
          path="/projects/:id"
          element={
            <ProjectDetails />
          }
        />



        <Route
          path="/customers"
          element={
            <Customers />
          }
        />



        <Route
          path="/customers/:id"
          element={
            <CustomerDetails />
          }
        />



        <Route
          path="/inventory"
          element={
            <Inventory />
          }
        />



        <Route
          path="/purchases"
          element={
            <Purchases />
          }
        />



        <Route
          path="/knowledge"
          element={
            <Knowledge />
          }
        />



        <Route
          path="/knowledge/:id"
          element={
            <KnowledgeDocumentDetails />
          }
        />



        <Route
          path="/memory"
          element={
            <Memory />
          }
        />



        <Route
          path="/agents"
          element={
            <Agents />
          }
        />



        <Route
          path="/system-pulse"
          element={
            <SystemPulse />
          }
        />



        <Route
          path="/spacemonkey-brain"
          element={
            <SpacemonkeyBrain />
          }
        />

<Route
  path="/spacemonkey"
  element={
    <Spacemonkey />
  }
/>

        <Route
          path="/settings"
          element={
            <Settings />
          }
        />


      </Route>


    </Routes>

  )

}


export default App
