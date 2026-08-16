import { test } from "node:test"

import assert from "node:assert/strict"

import fs from "node:fs"

import path from "node:path"

import { fileURLToPath } from "node:url"

import { computePreviewTarget, parseImports, parseRoutes, specifierForFile } from "./previewRouteInference.js"



const FIXTURE_APP_JSX = `
import { Routes, Route } from "react-router-dom"
import OSLayout from "./layouts/OSLayout"
import Dashboard from "./pages/Dashboard"
import Projects from "./pages/Projects"

function App() {
  return (
    <Routes>
      <Route element={<OSLayout />}>
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
      </Route>
    </Routes>
  )
}
export default App
`



test("parseImports finds default imports with their relative specifier", () => {

    const imports = parseImports(FIXTURE_APP_JSX)

    assert.deepEqual(
        imports.find(entry => entry.componentName === "Dashboard"),
        { componentName: "Dashboard", specifier: "./pages/Dashboard" },
    )

})



test("parseRoutes maps the index route to '/' and a normal route to its path attribute", () => {

    const routes = parseRoutes(FIXTURE_APP_JSX)

    assert.deepEqual(
        routes.find(entry => entry.componentName === "Dashboard"),
        { componentName: "Dashboard", routePath: "/" },
    )

    assert.deepEqual(
        routes.find(entry => entry.componentName === "Projects"),
        { componentName: "Projects", routePath: "/projects" },
    )

})



test("specifierForFile mirrors how App.jsx references a src/pages file", () => {

    assert.equal(specifierForFile("src/pages/Projects.jsx"), "./pages/Projects")
    assert.equal(specifierForFile("server/routes/devStudio.js"), null)

})



test("computePreviewTarget prefers a modify file that matches a real route", () => {

    const target = computePreviewTarget({
        files: [
            { filePath: "src/pages/Projects.jsx", action: "modify" },
        ],
        appJsxSource: FIXTURE_APP_JSX,
        port: 5555,
    })

    assert.deepEqual(target, {
        kind: "modify",
        routePath: "/projects",
        url: "http://127.0.0.1:5555/projects",
    })

})



test("computePreviewTarget falls back to the synthetic render route for a brand-new page", () => {

    const target = computePreviewTarget({
        files: [
            { filePath: "src/pages/NewPage.jsx", action: "create" },
        ],
        appJsxSource: FIXTURE_APP_JSX,
        port: 5555,
    })

    assert.equal(target.kind, "create")
    assert.equal(
        target.url,
        "http://127.0.0.1:5555/__devstudio-preview/render?file=src%2Fpages%2FNewPage.jsx",
    )

})



test("computePreviewTarget prefers the modify route even when the plan also creates a new sibling file", () => {

    const target = computePreviewTarget({
        files: [
            { filePath: "src/components/NewWidget.jsx", action: "create" },
            { filePath: "src/pages/Projects.jsx", action: "modify" },
        ],
        appJsxSource: FIXTURE_APP_JSX,
        port: 5555,
    })

    assert.equal(target.kind, "modify")
    assert.equal(target.routePath, "/projects")

})



test("computePreviewTarget falls back to root when a modified file has no matching route (e.g. a shared component)", () => {

    const target = computePreviewTarget({
        files: [
            { filePath: "src/components/layout/Sidebar.jsx", action: "modify" },
        ],
        appJsxSource: FIXTURE_APP_JSX,
        port: 5555,
    })

    assert.deepEqual(target, {
        kind: "root",
        routePath: "/",
        url: "http://127.0.0.1:5555/",
    })

})



test("computePreviewTarget returns null for an empty file list", () => {

    const target = computePreviewTarget({
        files: [],
        appJsxSource: FIXTURE_APP_JSX,
        port: 5555,
    })

    assert.equal(target, null)

})



test("still resolves correctly against the real, current src/App.jsx (guards against drift in its structure)", () => {

    const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

    // server/services/devStudio -> repo root -> src/App.jsx
    const realAppJsxPath = path.resolve(currentDirectory, "../../../src/App.jsx")

    const realAppJsxSource = fs.readFileSync(realAppJsxPath, "utf8")

    const target = computePreviewTarget({
        files: [
            { filePath: "src/pages/DevStudio.jsx", action: "modify" },
        ],
        appJsxSource: realAppJsxSource,
        port: 5555,
    })

    assert.equal(target.kind, "modify")
    assert.equal(target.routePath, "/dev-studio")

})
