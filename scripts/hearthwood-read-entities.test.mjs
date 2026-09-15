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

test("applyEdit writes a positional argument on a unit() factory call", () => {

    const result = applyEdit({
        filePath: "src/data/heartwood/units.js",
        exportName: "UNITS",
        edits: [
            { path: ["the-fool", "cost"], op: "set", value: 2 },
        ],
    })

    assert.equal(result.ok, true)
    assert.equal(result.applied.length, 1)
    assert.equal(result.applied[0].oldText, "0")
    assert.equal(result.applied[0].newText, "2")

    assert.ok(parseAst(result.proposedCode), "proposed code still parses")
})

test("applyEdit rejects an Identifier field on a unit() factory call (image)", () => {

    const result = applyEdit({
        filePath: "src/data/heartwood/units.js",
        exportName: "UNITS",
        edits: [
            { path: ["the-fool", "image"], op: "set", value: "nope" },
        ],
    })

    assert.equal(result.ok, false)
    assert.equal(result.rejected.length, 1)
    assert.match(result.rejected[0].reason, /Identifier/)
})

test("applyEdit writes into a string-id array export (dualClasses.js)", () => {

    const before = readEntities({ type: "dualClasses" })
    const entity = before.entities.find(e => typeof e.id === "string" && e.fields.name)

    assert.ok(entity, "at least one dualClass entity with a name field")

    const result = applyEdit({
        filePath: "src/data/heartwood/dualClasses.js",
        exportName: "DUAL_CLASSES",
        edits: [
            { path: [entity.id, "name"], op: "set", value: "Test Name" },
        ],
    })

    assert.equal(result.ok, true)
    assert.equal(result.applied.length, 1)
    assert.ok(parseAst(result.proposedCode), "proposed code still parses")
})

test("applyEdit writes into an index-id array export (tutorial.js)", () => {

    const before = readEntities({ type: "tutorial" })
    const entity = before.entities[0]

    const field = Object.keys(entity.fields).find(key => entity.fields[key].kind === "string")

    assert.ok(field, "first tutorial step has a string field")

    const result = applyEdit({
        filePath: "src/data/heartwood/tutorial.js",
        exportName: "TUTORIAL_STEPS",
        edits: [
            { path: [entity.id, field], op: "set", value: "TEST_VALUE" },
        ],
    })

    assert.equal(result.ok, true)
    assert.equal(result.applied.length, 1)
    assert.ok(parseAst(result.proposedCode), "proposed code still parses")
})

test("applyEdit addField inserts a new property, rejects an existing key", () => {

    const added = applyEdit({
        filePath: "src/data/heartwood/enemies.js",
        exportName: "ENEMIES",
        edits: [
            { path: ["rotwood-husk"], op: "addField", key: "testField", block: "testField: 42" },
        ],
    })

    assert.equal(added.ok, true)
    assert.equal(added.applied.length, 1)
    assert.ok(parseAst(added.proposedCode), "proposed code still parses")

    const duplicate = applyEdit({
        filePath: "src/data/heartwood/enemies.js",
        exportName: "ENEMIES",
        edits: [
            { path: ["rotwood-husk"], op: "addField", key: "maxHp", block: "maxHp: 999" },
        ],
    })

    assert.equal(duplicate.ok, false)
    assert.match(duplicate.rejected[0].reason, /already exists/)
})

test("applyEdit addField writes into a unit() factory call's options object", () => {

    const result = applyEdit({
        filePath: "src/data/heartwood/units.js",
        exportName: "UNITS",
        edits: [
            { path: ["the-fool"], op: "addField", key: "testFlag", block: "testFlag: true" },
        ],
    })

    assert.equal(result.ok, true)
    assert.equal(result.applied.length, 1)
    assert.ok(parseAst(result.proposedCode), "proposed code still parses")
})

test("applyEdit removeField deletes exactly one property, no dangling comma", () => {

    const before = readEntities({ type: "enemies" })
    const husk = before.entities.find(e => e.id === "rotwood-husk")

    assert.ok(husk.fields.art, "rotwood-husk has an art field before removal")

    const result = applyEdit({
        filePath: "src/data/heartwood/enemies.js",
        exportName: "ENEMIES",
        edits: [
            { path: ["rotwood-husk", "art"], op: "removeField" },
        ],
    })

    assert.equal(result.ok, true)
    assert.equal(result.applied.length, 1)
    assert.ok(parseAst(result.proposedCode), "proposed code still parses")

    // rotwood-sapling also has `art: "husk"` - a whole-file substring
    // check would pass by coincidence even if removal targeted the
    // wrong node, so re-read the PROPOSED code's rotwood-husk entity
    // specifically (readEntities takes a source override for exactly
    // this kind of check).
    const after = readEntities({ file: "enemies.js", exportName: "ENEMIES", source: result.proposedCode })
    const huskAfter = after.entities.find(e => e.id === "rotwood-husk")

    assert.ok(huskAfter, "rotwood-husk still present after removing one field")
    assert.equal(huskAfter.fields.art, undefined, "art field specifically is gone")
    assert.ok(huskAfter.fields.maxHp, "sibling fields untouched")
})

test("applyEdit removeKey deletes a whole entity, from a plain map and a spread-composed one", () => {

    const fromEnemies = applyEdit({
        filePath: "src/data/heartwood/enemies.js",
        exportName: "ENEMIES",
        edits: [{ path: ["rotwood-sapling"], op: "removeKey" }],
    })

    assert.equal(fromEnemies.ok, true)
    assert.ok(parseAst(fromEnemies.proposedCode), "enemies.js still parses")
    assert.ok(!fromEnemies.proposedCode.includes("\"rotwood-sapling\":"))

    const fromUnits = applyEdit({
        filePath: "src/data/heartwood/units.js",
        exportName: "UNITS",
        edits: [{ path: ["the-fool"], op: "removeKey" }],
    })

    assert.equal(fromUnits.ok, true)
    assert.ok(parseAst(fromUnits.proposedCode), "units.js still parses")
    assert.ok(!fromUnits.proposedCode.includes("\"the-fool\":"))
})
