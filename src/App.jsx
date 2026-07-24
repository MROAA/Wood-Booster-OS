import {
  useEffect,
} from "react"

import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom"

import Layout from "./components/layout/Layout"

import AIWorkspace from "./pages/AIWorkspace"
import CapabilityCenter from "./pages/CapabilityCenter"
import Customers from "./pages/Customers"
import Dashboard from "./pages/Dashboard"
import ExecutionCenterV2 from "./pages/ExecutionCenterV2"
import Knowledge from "./pages/Knowledge"
import Memory from "./pages/Memory"
import ProjectDetails from "./pages/ProjectDetails"
import Projects from "./pages/Projects"
import Settings from "./pages/Settings"
import Tools from "./pages/Tools"

import {
  resolveRouteContext,
  updateRuntimeContext,
} from "./services/runtime/runtimeContext"


function RuntimeContextController() {
  const location =
    useLocation()

  useEffect(
    () => {
      const routeContext =
        resolveRouteContext(
          location.pathname,
        )

      updateRuntimeContext({
        currentLocation: {
          pathname:
            location.pathname,
          search:
            location.search,
          hash:
            location.hash,
        },

        currentPage:
          routeContext,

        updatedAt:
          new Date().toISOString(),
      })
    },
    [
      location.pathname,
      location.search,
      location.hash,
    ],
  )

  return null
}


function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={<AIWorkspace />}
      />

      <Route
        path="/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/projects"
        element={<Projects />}
      />

      <Route
        path="/projects/:id"
        element={<ProjectDetails />}
      />

      <Route
        path="/customers"
        element={<Customers />}
      />

      <Route
        path="/brain"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

      <Route
        path="/knowledge"
        element={<Knowledge />}
      />

      <Route
        path="/memory"
        element={<Memory />}
      />

      <Route
        path="/capabilities"
        element={<CapabilityCenter />}
      />

      <Route
        path="/execution"
        element={<ExecutionCenterV2 />}
      />

      <Route
        path="/tools"
        element={<Tools />}
      />

      <Route
        path="/settings"
        element={<Settings />}
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}


function App() {
  return (
    <>
      <RuntimeContextController />

      <Layout>
        <AppRoutes />
      </Layout>
    </>
  )
}


export default App
