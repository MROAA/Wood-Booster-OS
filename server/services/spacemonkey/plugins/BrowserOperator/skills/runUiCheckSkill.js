/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Run UI Check Skill
 *
 * Operaattorin suljettu kierros yhdelle käyttöliittymätestille:
 *
 *   1. avaa tehtävän Spacemonkeyn työtilaan
 *   2. HAVAITSE: vastaavatko HQ:n käyttöliittymä ja backend (sallitut
 *      terveysreitit system-observer-työkalulla)
 *   3. TOIMI: ajaa skenaarion eristetyssä selaimessa
 *   4. TODENNA: askelten, sivuvirheiden ja pyyntöjen tulos
 *   5. MUISTA: raportti (JSON + teksti) ja kuvakaappaukset tehtävän
 *      kansioon, tehtävä suljetaan tilaan done tai failed
 */

import { formatUiCheck } from "../../../browser/uiCheckText.js"

const REQUIRED_ENDPOINTS = ["hq-frontend", "hq-backend"]

const runUiCheckSkill = {

    id: "run-ui-check",

    name: "Run UI Check",

    description:
        "Checks that HQ's UI and backend respond, runs a predefined UI " +
        "scenario in an isolated browser and saves the report and " +
        "screenshots in a task folder of Spacemonkey's workspace.",

    async execute(context) {

        const { toolBus, workspace, scenarioId, browserRuntime = {}, observerDeps } = context || {}

        const workspaceRuntime = { workspace }

        const task = await toolBus.execute(
            "spacemonkey-workspace",
            { action: "create-task", kind: "ui-check", label: `Käyttöliittymätesti: ${scenarioId}` },
            workspaceRuntime,
        )

        if (!task.success) {
            return task
        }

        const taskId = task.result.id

        async function finish(state, summary) {
            await toolBus.execute(
                "spacemonkey-workspace",
                { action: "finish-task", taskId, state, summary },
                workspaceRuntime,
            )
        }

        const health = await toolBus.execute(
            "system-observer",
            { action: "endpoints", endpointIds: REQUIRED_ENDPOINTS },
            { observerDeps },
        )

        const down = (health.endpoints || []).filter(endpoint => !endpoint.ok)

        if (!health.success || down.length > 0) {
            const summary = `Ei vastaa: ${down.map(endpoint => endpoint.name || endpoint.id).join(", ")}`

            await finish("failed", summary)

            return {
                success: false,
                code: "service_down",
                error: `${summary}. Selaintestiä ei ajettu.`,
                taskId,
                endpoints: health.endpoints || [],
            }
        }

        const run = await toolBus.execute(
            "browser-operator",
            { action: "run-scenario", scenarioId, taskId },
            { workspace, ...browserRuntime },
        )

        if (!run.success) {
            await finish("failed", run.error)

            return { ...run, taskId }
        }

        const text = formatUiCheck(run.report)

        const files = [...run.report.screenshots]

        for (const [name, content] of [
            ["ui-check.json", JSON.stringify({ endpoints: health.endpoints, ...run.report }, null, 2)],
            ["ui-check.md", `${text}\n`],
        ]) {
            const written = await toolBus.execute(
                "spacemonkey-workspace",
                { action: "write-task-file", taskId, name, content },
                workspaceRuntime,
            )

            if (written.success) {
                files.push(written.result.path)
            }
        }

        await finish(run.report.ok ? "done" : "failed", run.report.ok ? "läpäisty" : run.report.error || "epäonnistui")

        return {
            success: true,
            report: run.report,
            endpoints: health.endpoints,
            text,
            taskId,
            files,
        }

    },

}

export default runUiCheckSkill
