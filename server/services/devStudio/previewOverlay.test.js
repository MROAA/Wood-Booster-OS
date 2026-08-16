import { test } from "node:test"

import assert from "node:assert/strict"

import path from "node:path"

import { createOverlayStore } from "./previewOverlay.js"



const PROJECT_ROOT = "/repo"



test("get returns overlay content for an exact modify-action path", () => {

    const store = createOverlayStore(PROJECT_ROOT)

    store.setFiles([
        { filePath: "src/pages/Dashboard.jsx", proposedCode: "export default function Dashboard() {}" },
    ])

    const id = path.join(PROJECT_ROOT, "src/pages/Dashboard.jsx")

    assert.equal(store.has(id), true)
    assert.equal(store.get(id), "export default function Dashboard() {}")

})



test("get strips a query string before matching, so Vite's cache-busting ids still hit", () => {

    const store = createOverlayStore(PROJECT_ROOT)

    store.setFiles([
        { filePath: "src/pages/Dashboard.jsx", proposedCode: "content" },
    ])

    const id = path.join(PROJECT_ROOT, "src/pages/Dashboard.jsx") + "?t=12345"

    assert.equal(store.has(id), true)
    assert.equal(store.get(id), "content")

})



test("resolveCandidate resolves a relative import missing its extension to a new overlay file", () => {

    const store = createOverlayStore(PROJECT_ROOT)

    store.setFiles([
        { filePath: "src/components/NewWidget.jsx", proposedCode: "export default function NewWidget() {}" },
    ])

    const importer = path.join(PROJECT_ROOT, "src/pages/Dashboard.jsx")

    const resolved = store.resolveCandidate("../components/NewWidget", importer)

    assert.equal(resolved, path.join(PROJECT_ROOT, "src/components/NewWidget.jsx"))

})



test("resolveCandidate resolves a root-absolute /src/... import (used by the preview harness's dynamic import)", () => {

    const store = createOverlayStore(PROJECT_ROOT)

    store.setFiles([
        { filePath: "src/pages/NewPage.jsx", proposedCode: "export default function NewPage() {}" },
    ])

    const resolved = store.resolveCandidate("/src/pages/NewPage.jsx", null)

    assert.equal(resolved, path.join(PROJECT_ROOT, "src/pages/NewPage.jsx"))

})



test("resolveCandidate returns null for an import that isn't part of the overlay", () => {

    const store = createOverlayStore(PROJECT_ROOT)

    store.setFiles([
        { filePath: "src/pages/NewPage.jsx", proposedCode: "content" },
    ])

    const importer = path.join(PROJECT_ROOT, "src/pages/Dashboard.jsx")

    assert.equal(store.resolveCandidate("../components/Unrelated", importer), null)
    assert.equal(store.resolveCandidate("react", importer), null)

})



test("resolveCandidate handles @vitejs/plugin-react's Fast Refresh self-import (an already-fully-resolved absolute path) for a not-yet-on-disk create file", () => {

    // Regression test: found live when previewing a real 'create' plan
    // through an actual Vite dev server - the react plugin injects
    // `import * as __vite_react_currentExports from "<the module's own
    // resolved absolute id>"` into every module for Fast Refresh boundary
    // detection. Naively treating this as a root-relative "/src/..." path
    // (like resolveCandidate does for the preview harness's own dynamic
    // import) and path.joining it onto projectRoot produced a garbage,
    // doubly-nested path that matched nothing - a 500 in the browser for
    // any brand-new file, even though its content was fine.
    const store = createOverlayStore(PROJECT_ROOT)

    const absolutePath = path.join(PROJECT_ROOT, "src/pages/NewPage.jsx")

    store.setFiles([
        { filePath: "src/pages/NewPage.jsx", proposedCode: "export default function NewPage() {}" },
    ])

    assert.equal(store.resolveCandidate(absolutePath, absolutePath), absolutePath)

})



test("setFiles replaces the whole overlay, so a previous plan's files stop matching", () => {

    const store = createOverlayStore(PROJECT_ROOT)

    store.setFiles([
        { filePath: "src/pages/A.jsx", proposedCode: "a" },
    ])

    store.setFiles([
        { filePath: "src/pages/B.jsx", proposedCode: "b" },
    ])

    assert.equal(store.has(path.join(PROJECT_ROOT, "src/pages/A.jsx")), false)
    assert.equal(store.has(path.join(PROJECT_ROOT, "src/pages/B.jsx")), true)

})
