import {
  Routes,
  Route,
  useNavigate,
} from "react-router-dom"
import OSLayout from "./layouts/OSLayout"
import Dashboard from "./pages/Dashboard"
import Spacemonkey from "./pages/Spacemonkey"
import Projects from "./pages/Projects"
import ProjectDetails from "./pages/ProjectDetails"
import Customers from "./pages/Customers"
import CustomerDetails from "./pages/CustomerDetails"
import Inventory from "./pages/Inventory"
import Purchases from "./pages/Purchases"
import Invoices from "./pages/Invoices"
import Quotes from "./pages/Quotes"
import Knowledge from "./pages/Knowledge"
import KnowledgeDocumentDetails from "./pages/KnowledgeDocumentDetails"
import Memory from "./pages/Memory"
import Agents from "./pages/Agents"
import Settings from "./pages/Settings"
import SystemPulse from "./pages/SystemPulse"
import SpacemonkeyBrain from "./pages/SpacemonkeyBrain"
import SpacemonkeyPersona from "./pages/SpacemonkeyPersona"
import AIBrain from "./pages/AIBrain"
import AIChat from "./pages/AIChat"
import AIGenerator from "./pages/AIGenerator"
import AIWorkspace from "./pages/AIWorkspace"
import CapabilityCenter from "./pages/CapabilityCenter"
import ExecutionCenterV2 from "./pages/ExecutionCenterV2"
import SystemCenter from "./pages/SystemCenter"
import Tools from "./pages/Tools"
import DevStudio from "./pages/DevStudio"
import SpiderSolitaire from "./pages/SpiderSolitaire"
import KnowledgeUpload from "./pages/KnowledgeUpload"
import SpacemonkeyChat from "./pages/SpacemonkeyChat"
import BoosterverseDesktop from "./pages/BoosterverseDesktop"
import ProjectWorkspace from "./pages/ProjectWorkspace"

function BoosterverseDesktopRoute() {
  const navigate = useNavigate()
  return <BoosterverseDesktop onExit={() => navigate("/")} />
}

function App() {
  return (
    <Routes>
      <Route
        element={
          <OSLayout />
        }
      >
        <Route
          index
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
          path="/invoices"
          element={
            <Invoices />
          }
        />
        <Route
          path="/quotes"
          element={
            <Quotes />
          }
        />
        <Route
          path="/knowledge"
          element={
            <Knowledge />
          }
        />
        <Route
          path="/knowledge/upload"
          element={
            <KnowledgeUpload />
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
          path="/spacemonkey-diagnostics"
          element={
            <SpacemonkeyPersona />
          }
        />
        <Route
          path="/spacemonkey"
          element={
            <Spacemonkey />
          }
        />
        <Route
          path="/spacemonkey-chat"
          element={
            <SpacemonkeyChat />
          }
        />
        <Route
          path="/project-workspace"
          element={
            <ProjectWorkspace />
          }
        />
        <Route
          path="/settings"
          element={
            <Settings />
          }
        />
        <Route
          path="/ai-brain"
          element={
            <AIBrain />
          }
        />
        <Route
          path="/ai-chat"
          element={
            <AIChat />
          }
        />
        <Route
          path="/ai-generator"
          element={
            <AIGenerator />
          }
        />
        <Route
          path="/ai-workspace"
          element={
            <AIWorkspace />
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
          path="/system-center"
          element={
            <SystemCenter />
          }
        />
        <Route
          path="/tools"
          element={
            <Tools />
          }
        />
        <Route
          path="/dev-studio"
          element={
            <DevStudio />
          }
        />
        <Route
          path="/spider-solitaire"
          element={
            <SpiderSolitaire />
          }
        />
        <Route
          path="/desktop"
          element={
            <BoosterverseDesktopRoute />
          }
        />
      </Route>
    </Routes>
  )
}
export default App