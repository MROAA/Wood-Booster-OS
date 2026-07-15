import { Route, Routes } from "react-router"

import Sidebar from "./components/Sidebar"
import CustomerDetails from "./pages/CustomerDetails"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"
import Customers from "./pages/Customers"
import Inventory from "./pages/Inventory"
import Purchases from "./pages/Purchases"
import AIGenerator from "./pages/AIGenerator"
import AIChat from "./pages/AIChat"
import Agents from "./pages/Agents"
import Knowledge from "./pages/Knowledge"
import Settings from "./pages/Settings"
import ProjectDetails from "./pages/ProjectDetails"

function App() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1">
          <div className="mx-auto max-w-7xl px-8 py-10">
            <Routes>
              <Route
                path="/"
                element={<Dashboard />}
              />

              <Route
                path="/projects"
                element={<Projects />}
              />

              <Route
                path="/projects/:projectId"
                element={<ProjectDetails />}
              />

              <Route
                path="/customers"
                element={<Customers />}
              />

              <Route
                path="/customers/:customerId"
                element={<CustomerDetails />}
              />

              <Route
                path="/inventory"
                element={<Inventory />}
              />

              <Route
                path="/purchases"
                element={<Purchases />}
              />

              <Route
                path="/ai-generator"
                element={<AIGenerator />}
              />

              <Route
                path="/ai-chat"
                element={<AIChat />}
              />

              <Route
                path="/agents"
                element={<Agents />}
              />

              <Route
                path="/knowledge"
                element={<Knowledge />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />
            </Routes>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App