import { test } from "node:test"

import assert from "node:assert/strict"

import hqProjectsTool from "../tools/hqProjectsTool.js"

import { createFakePrisma } from "./fakePrisma.js"



const PROJECTS = [
    { id: 1, name: "Keittiön tasot", status: "Suunnittelu", openSteps: 3 },
    { id: 2, name: "Sauna", status: "Valmis", openSteps: 0 },
    { id: 3, name: "Pöytä", status: "Tarjous", openSteps: 0 },
]



test("list-unfinished leaves out Valmis projects and counts open steps", async () => {

    const { prisma, writes } = createFakePrisma({ projects: PROJECTS })

    const result = await hqProjectsTool.execute(
        { action: "list-unfinished" },
        { prisma },
    )

    assert.equal(result.success, true)

    assert.equal(result.total, 2)

    assert.equal(result.truncated, false)

    assert.deepEqual(
        result.projects.map(project => [project.name, project.openSteps]),
        [["Keittiön tasot", 3], ["Pöytä", 0]],
    )

    assert.deepEqual(writes, [])

})



test("list-unfinished asks only for named project fields", async () => {

    const { prisma, calls } = createFakePrisma({ projects: PROJECTS })

    await hqProjectsTool.execute({ action: "list-unfinished" }, { prisma })

    const findMany = calls.find(call => call.method === "findMany")

    assert.deepEqual(findMany.args.where, { status: { not: "Valmis" } })

    assert.ok(findMany.args.select, "a select keeps unrelated columns out")

    assert.equal("customer" in findMany.args.select, false)

    assert.equal(findMany.args.take, 50)

})



test("summary reads one project by its id and never selects customer contact details", async () => {

    const { prisma, calls, writes } = createFakePrisma({
        details: {
            7: {
                id: 7,
                name: "Hylly",
                status: "Suunnittelu",
                deadline: null,
                description: "Tammihylly",
                customer: { name: "Matti", company: null },
                workflowSteps: [{ id: 1, title: "Mittaus", done: true }],
                timelineTasks: [],
                quote: null,
                projectNotes: [{ title: null, content: "x".repeat(500), createdAt: new Date() }],
                _count: { materials: 2, files: 0, projectNotes: 1 },
            },
        },
    })

    const result = await hqProjectsTool.execute(
        { action: "summary", projectId: "7" },
        { prisma },
    )

    assert.equal(result.success, true)

    assert.equal(result.project.name, "Hylly")

    assert.equal(result.project.customerName, "Matti")

    assert.equal(result.project.latestNote.excerpt.length, 200)

    const findUnique = calls.find(call => call.method === "findUnique")

    assert.deepEqual(findUnique.args.where, { id: 7 })

    assert.deepEqual(
        Object.keys(findUnique.args.select.customer.select).sort(),
        ["company", "name"],
    )

    assert.deepEqual(writes, [])

})



test("summary rejects a missing or malformed project id before querying", async () => {

    const { prisma, calls } = createFakePrisma()

    for (const projectId of [undefined, null, "abc", 0, -1, 1.5]) {
        const result = await hqProjectsTool.execute(
            { action: "summary", projectId },
            { prisma },
        )

        assert.equal(result.success, false)

        assert.equal(result.code, "invalid_project_id")
    }

    assert.equal(calls.length, 0)

})



test("summary of an unknown project is a controlled not-found", async () => {

    const { prisma } = createFakePrisma()

    const result = await hqProjectsTool.execute(
        { action: "summary", projectId: 99 },
        { prisma },
    )

    assert.equal(result.success, false)

    assert.equal(result.code, "project_not_found")

})



test("unknown actions and write-looking actions are refused", async () => {

    const { prisma, calls } = createFakePrisma()

    for (const action of ["update", "delete", "create", undefined]) {
        const result = await hqProjectsTool.execute({ action }, { prisma })

        assert.equal(result.success, false)

        assert.equal(result.code, "unknown_action")
    }

    assert.equal(calls.length, 0)

    assert.deepEqual(hqProjectsTool.actions, ["list-unfinished", "summary"])

})



test("no database means a clear error, not a crash", async () => {

    const result = await hqProjectsTool.execute({ action: "list-unfinished" })

    assert.equal(result.success, false)

    assert.equal(result.code, "database_unavailable")

})



test("a failing query is reported as query_failed", async () => {

    const { prisma } = createFakePrisma({ failWith: "SQLITE_BUSY" })

    const result = await hqProjectsTool.execute(
        { action: "list-unfinished" },
        { prisma },
    )

    assert.equal(result.success, false)

    assert.equal(result.code, "query_failed")

    assert.match(result.error, /SQLITE_BUSY/)

})
