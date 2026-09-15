import test from "node:test"

import assert from "node:assert/strict"

import { classifyRisk } from "./riskModel.js"

test("scalar field edit on a data file is LOW, no confirm, live allowed", () => {

    const result = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: {
            ops: [{ path: ["rotwood-husk", "maxHp"], op: "set", value: 40 }],
        },
    })

    assert.equal(result.tier, "LOW")
    assert.equal(result.requiresConfirm, false)
    assert.equal(result.requiresTypeYes, false)
    assert.deepEqual(result.allowedModes, ["live", "pr"])

})

test("edit through an array field / numeric index is MEDIUM", () => {

    const result = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: {
            ops: [{
                path: ["rotwood-husk", "movePattern", 0, "amount"],
                op: "set",
                value: 15,
            }],
        },
    })

    assert.equal(result.tier, "MEDIUM")
    assert.equal(result.requiresConfirm, true)
    assert.deepEqual(result.allowedModes, ["live", "pr"])

})

test("whole-file edit of an engine file is HIGH, PR only, confirm required", () => {

    const result = classifyRisk({
        targetFiles: ["src/services/heartwood/autoBattleEngine.js"],
        editSpec: { mode: "wholeFile" },
    })

    assert.equal(result.tier, "HIGH")
    assert.equal(result.requiresConfirm, true)
    assert.deepEqual(result.allowedModes, ["pr"])

})

test("editing the save-format file is CRITICAL and needs a typed YES", () => {

    const result = classifyRisk({
        targetFiles: ["src/services/heartwood/runSaveState.js"],
        editSpec: {
            ops: [{ path: ["SAVE_VERSION"], op: "set", value: 3 }],
        },
    })

    assert.equal(result.tier, "CRITICAL")
    assert.equal(result.requiresTypeYes, true)
    assert.deepEqual(result.allowedModes, ["pr"])

})

test("whole-file edit of a data file is bumped LOW -> MEDIUM", () => {

    const result = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: { mode: "wholeFile" },
    })

    assert.equal(result.tier, "MEDIUM")
    assert.equal(result.requiresConfirm, true)

})

test("a single CSS declaration edit is MEDIUM + requiresConfirm (build can't see a visual regression)", () => {

    const result = classifyRisk({
        targetFiles: ["src/components/heartwood/heartwood.css"],
        editSpec: {
            ops: [{
                path: [".hw-card", "border-color"],
                op: "set",
                value: "#8a8a8a",
            }],
        },
    })

    assert.equal(result.tier, "MEDIUM")
    assert.equal(result.requiresConfirm, true)
    assert.deepEqual(result.allowedModes, ["live", "pr"])

})

test("a target outside src/** and .scratch/** is CRITICAL", () => {

    const result = classifyRisk({
        targetFiles: ["server/index.js"],
        editSpec: { ops: [{ path: ["x"], op: "set", value: 1 }] },
    })

    assert.equal(result.tier, "CRITICAL")
    assert.equal(result.requiresTypeYes, true)
    assert.deepEqual(result.allowedModes, ["pr"])

})

test("two or more ops on a data file is MEDIUM", () => {

    const result = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: {
            ops: [
                { path: ["rotwood-husk", "maxHp"], op: "set", value: 40 },
                { path: ["rotwood-husk", "name"], op: "set", value: "Husk" },
            ],
        },
    })

    assert.equal(result.tier, "MEDIUM")
    assert.equal(result.requiresConfirm, true)

})

test("an addKey op (new entity) is MEDIUM", () => {

    const result = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: {
            ops: [{ path: ["ENEMIES"], op: "addKey", key: "new-husk", block: "{}" }],
        },
    })

    assert.equal(result.tier, "MEDIUM")

})

test("a setImportedImage op (image swap) is MEDIUM", () => {

    const result = classifyRisk({
        targetFiles: ["src/data/heartwood/units.js"],
        editSpec: {
            ops: [{
                path: ["the-fool", "image"],
                op: "setImportedImage",
                importPath: "../../assets/heartwood/units/the-fool-2.jpg",
            }],
        },
    })

    assert.equal(result.tier, "MEDIUM")
    assert.equal(result.requiresConfirm, true)

})

test("a setRaw op (complex field replaced wholesale) is MEDIUM", () => {

    const result = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: {
            ops: [{
                path: ["rotwood-husk", "movePattern"],
                op: "setRaw",
                value: "[{ type: \"attack\", amount: 12 }]",
            }],
        },
    })

    assert.equal(result.tier, "MEDIUM")
    assert.equal(result.requiresConfirm, true)

})

test("whole-file edit of a Hearthwood component is bumped MEDIUM -> HIGH", () => {

    const result = classifyRisk({
        targetFiles: ["src/components/heartwood/BattleView.jsx"],
        editSpec: { mode: "wholeFile" },
    })

    assert.equal(result.tier, "HIGH")
    assert.deepEqual(result.allowedModes, ["pr"])

})

test("worst tier wins across multiple target files", () => {

    const result = classifyRisk({
        targetFiles: [
            "src/data/heartwood/enemies.js",
            "src/services/heartwood/runEngine.js",
        ],
        editSpec: {
            ops: [{ path: ["rotwood-husk", "maxHp"], op: "set", value: 40 }],
        },
    })

    assert.equal(result.tier, "HIGH")

})

test("reasons is always a non-empty array of strings", () => {

    const low = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: {
            ops: [{ path: ["rotwood-husk", "maxHp"], op: "set", value: 40 }],
        },
    })

    assert.ok(Array.isArray(low.reasons))
    assert.ok(low.reasons.length > 0)
    assert.ok(low.reasons.every(reason => typeof reason === "string"))

})

test("addField/removeField/removeKey ops are all MEDIUM", () => {

    const addField = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: { ops: [{ path: ["rotwood-husk"], op: "addField", key: "cold", value: -2 }] },
    })

    const removeField = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: { ops: [{ path: ["rotwood-husk", "art"], op: "removeField" }] },
    })

    const removeKey = classifyRisk({
        targetFiles: ["src/data/heartwood/enemies.js"],
        editSpec: { ops: [{ path: ["rotwood-husk"], op: "removeKey" }] },
    })

    assert.equal(addField.tier, "MEDIUM")
    assert.equal(removeField.tier, "MEDIUM")
    assert.equal(removeKey.tier, "MEDIUM")
    assert.ok([addField, removeField, removeKey].every(r => r.requiresConfirm))

})
