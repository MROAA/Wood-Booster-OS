/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Spacemonkey Workspace Tool
 *
 * Ainoa reitti Spacemonkeyn omaan työtilaan (workspace/
 * SpacemonkeyWorkspace.js). Kirjoittaa vain työtilan sisälle - ei
 * koskaan projektiin. Työtilan instanssi tulee ToolBusin
 * runtime-argumenttina.
 */

const ACTIONS = {
    "create-task": (workspace, input) => workspace.createTask({ kind: input.kind, label: input.label }),
    "write-task-file": (workspace, input) =>
        workspace.writeFile(workspace.taskPath(input.taskId, input.name), input.content),
    "finish-task": (workspace, input) =>
        workspace.finishTask(input.taskId, { state: input.state, summary: input.summary }),
    "list-tasks": workspace => workspace.listTasks(),
    usage: workspace => workspace.usage(),
}

const workspaceTool = {

    id: "spacemonkey-workspace",

    name: "Spacemonkey Workspace",

    description:
        "Creates task folders and writes files only inside Spacemonkey's " +
        "own workspace (path traversal, symlinks, protected paths and " +
        "oversized files are refused).",

    readOnly: false,

    actions: Object.keys(ACTIONS),

    async execute(input = {}, runtime = null) {

        const workspace = runtime?.workspace

        if (!workspace) {
            return { success: false, code: "workspace_missing", error: "Työtila puuttuu." }
        }

        const action = ACTIONS[input.action]

        if (!action) {
            return { success: false, code: "unknown_action", error: `Tuntematon toiminto: ${input.action}` }
        }

        try {
            return { success: true, result: await action(workspace, input) }
        } catch (error) {
            return { success: false, code: error.code || "workspace_failed", error: error.message }
        }

    },

}

export default workspaceTool
