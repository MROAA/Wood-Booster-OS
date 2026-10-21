/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Check System Status Skill
 *
 * Avaa tehtävän Spacemonkeyn työtilaan, lukee koneen tilan
 * system-observer-työkalulla ja tallentaa raportin (JSON + teksti)
 * tehtävän kansioon. Ei muuta mitään työtilan ulkopuolella.
 */

import { formatSystemStatus } from "../../../os/systemStatusText.js"

const checkSystemStatusSkill = {

    id: "check-system-status",

    name: "Check System Status",

    description:
        "Reads the machine and HQ service status and saves the report " +
        "into a task folder in Spacemonkey's own workspace.",

    async execute(context) {

        const { toolBus, workspace, projectRoot, observerDeps } = context || {}

        const task = await toolBus.execute(
            "spacemonkey-workspace",
            { action: "create-task", kind: "system-status", label: "Koneen ja palveluiden tila" },
            { workspace },
        )

        if (!task.success) {
            return task
        }

        const taskId = task.result.id

        const observed = await toolBus.execute(
            "system-observer",
            { action: "snapshot" },
            { projectRoot, workspaceRoot: workspace.root, observerDeps },
        )

        if (!observed.success) {
            await toolBus.execute(
                "spacemonkey-workspace",
                { action: "finish-task", taskId, state: "failed", summary: observed.error },
                { workspace },
            )

            return observed
        }

        const text = formatSystemStatus(observed.report)

        const files = []

        for (const [name, content] of [
            ["system-status.json", JSON.stringify(observed.report, null, 2)],
            ["system-status.md", `${text}\n`],
        ]) {
            const written = await toolBus.execute(
                "spacemonkey-workspace",
                { action: "write-task-file", taskId, name, content },
                { workspace },
            )

            if (!written.success) {
                return written
            }

            files.push(written.result.path)
        }

        await toolBus.execute(
            "spacemonkey-workspace",
            {
                action: "finish-task",
                taskId,
                state: "done",
                summary: `${observed.report.warnings.length} huomiota`,
            },
            { workspace },
        )

        return {
            success: true,
            report: observed.report,
            text,
            taskId,
            files,
        }

    },

}

export default checkSystemStatusSkill
