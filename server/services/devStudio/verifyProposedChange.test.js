import { test } from "node:test"

import assert from "node:assert/strict"

import { extractExportedNames, isVacuousTest } from "./verifyProposedChange.js"



test("extractExportedNames finds function/const/class/default exports", () => {

    const code = `
        export function addOne(n) { return n + 1 }
        export const TAX_RATE = 0.24
        export class Widget {}
        export default function mainThing() {}
    `

    const names = extractExportedNames(code)

    assert.equal(names.has("addOne"), true)
    assert.equal(names.has("TAX_RATE"), true)
    assert.equal(names.has("Widget"), true)
    assert.equal(names.has("mainThing"), true)

})



test("extractExportedNames finds named export blocks, including aliases", () => {

    const code = `
        function helper() {}
        const CONFIG = {}
        export { helper, CONFIG as Config }
    `

    const names = extractExportedNames(code)

    assert.equal(names.has("helper"), true)
    assert.equal(names.has("CONFIG"), true)

})



test("extractExportedNames returns an empty set for code with no exports", () => {

    const names = extractExportedNames("console.log('just a script, no exports')")

    assert.equal(names.size, 0)

})



test("isVacuousTest: false when the test references an actual export", () => {

    const proposedCode = "export function addOne(n) { return n + 1 }"

    const testCode = `
        import { addOne } from './target.mjs'
        test('adds one', () => { assert.equal(addOne(1), 2) })
    `

    assert.equal(isVacuousTest({ testCode, proposedCode }), false)

})



test("isVacuousTest: true when the test never references any real export", () => {

    const proposedCode = "export function addOne(n) { return n + 1 }"

    const testCode = `
        test('does something unrelated', () => { assert.equal(1 + 1, 2) })
    `

    assert.equal(isVacuousTest({ testCode, proposedCode }), true)

})



test("isVacuousTest: false (cannot evaluate) when the proposed code has no exports at all", () => {

    const proposedCode = "console.log('side effect only file')"

    const testCode = "test('whatever', () => { assert.ok(true) })"

    assert.equal(isVacuousTest({ testCode, proposedCode }), false)

})
