/**
 * Wood-Booster HQ
 * Boosterverse - Hearthwood Patchbay
 *
 * scripts/hearthwood-read-entities.test.mjs   (run: `node --test`)
 *
 * Guards plan risk R2: the deterministic applier depends on vite's
 * `parseAst` being importable from the repo-root node_modules AND on its
 * nodes carrying numeric byte offsets. A Vite bump that changed either
 * would break every edit silently - this test fails loudly instead.
 */

import test from "node:test"
import assert from "node:assert/strict"
import { parseAst } from "vite"

import { readEntities } from "./hearthwood-read-entities.mjs"
import { applyEdit } from "./hearthwood-apply-edit.mjs"

test("parseAst imports and returns numeric offsets on a known node", () => {

    const source =
        "import x from \"./x.js\"\n"
        + "export const MAP = {\n"
        + "  \"a-foe\": { id: \"a-foe\", name: \"A Foe\", maxHp: 58, cold: -3 },\n"
        + "}\n"

    const ast = parseAst(source)

    assert.equal(typeof ast, "object")
    assert.ok(Array.isArray(ast.body))

    const exportDecl = ast.body.find(
        node => node.type === "ExportNamedDeclaration",
    )

    assert.ok(exportDecl, "export declaration found")

    const init = exportDecl.declaration.declarations[0].init

    assert.equal(init.type, "ObjectExpression")

    const maxHpValue = init.properties[0].value.properties.find(
        p => p.key.value === "maxHp" || p.key.name === "maxHp",
    ).value

    assert.equal(typeof maxHpValue.start, "number")
    assert.equal(typeof maxHpValue.end, "number")
    assert.equal(source.slice(maxHpValue.start, maxHpValue.end), "58")
})

test("readEntities walks a real data file and reports scalar ranges", () => {

    const result = readEntities({ type: "enemies" })

    assert.equal(result.exportName, "ENEMIES")
    assert.ok(result.entities.length > 0)

    const husk = result.entities.find(e => e.id === "rotwood-husk")

    assert.ok(husk, "rotwood-husk present")
    assert.equal(husk.name, "Rotwood Husk")
    assert.equal(husk.fields.maxHp.value, 58)
    assert.equal(husk.fields.maxHp.kind, "number")
    assert.equal(typeof husk.fields.maxHp.range[0], "number")
    assert.equal(typeof husk.fields.maxHp.range[1], "number")
    assert.ok(husk.complexKeys.includes("movePattern"))
})

test("readEntities handles a spread-composed map (units.js)", () => {

    const result = readEntities({ type: "units" })

    assert.ok(
        result.entities.length > 0,
        "spread-composed UNITS still yields entities",
    )
})

test("applyEdit splices exactly one scalar and nothing else", () => {

    const result = applyEdit({
        filePath: "src/data/heartwood/enemies.js",
        exportName: "ENEMIES",
        edits: [
            { path: ["rotwood-husk", "maxHp"], op: "set", value: 40 },
        ],
    })

    assert.equal(result.ok, true)
    assert.equal(result.applied.length, 1)
    assert.equal(result.applied[0].oldText, "58")
    assert.equal(result.applied[0].newText, "40")

    const ast = parseAst(result.proposedCode)

    assert.ok(ast, "proposed code still parses")
})

test("applyEdit rejects a non-scalar target, exit stays zero", () => {

    const result = applyEdit({
        filePath: "src/data/heartwood/enemies.js",
        exportName: "ENEMIES",
        edits: [
            { path: ["rotwood-husk", "movePattern"], op: "set", value: 1 },
        ],
    })

    assert.equal(result.ok, false)
    assert.equal(result.rejected.length, 1)
    assert.match(result.rejected[0].reason, /scalar/)
})
