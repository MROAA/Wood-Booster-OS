/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Describe Workspace Skill
 *
 * Kertoo mitä Spacemonkeyn työtilassa on: tehtävät tiloineen ja
 * käytetty tila. Vain luku.
 */

const describeWorkspaceSkill = {

    id: "describe-workspace",

    name: "Describe Workspace",

    description:
        "Lists the tasks in Spacemonkey's workspace and its disk usage. " +
        "Read-only.",

    async execute(context) {

        const { toolBus, workspace } = context || {}

        const [tasks, usage] = await Promise.all([
            toolBus.execute("spacemonkey-workspace", { action: "list-tasks" }, { workspace }),
            toolBus.execute("spacemonkey-workspace", { action: "usage" }, { workspace }),
        ])

        if (!tasks.success) {
            return tasks
        }

        if (!usage.success) {
            return usage
        }

        return {
            success: true,
            root: workspace.root,
            tasks: tasks.result,
            usage: usage.result,
        }

    },

}

export default describeWorkspaceSkill
