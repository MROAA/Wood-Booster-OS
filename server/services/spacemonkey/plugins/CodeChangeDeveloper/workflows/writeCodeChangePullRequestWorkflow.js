/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Code Change Pull Request Workflow
 *
 * Ajaa write-code-change-pull-request-skillin.
 */

const writeCodeChangePullRequestWorkflow = {

    id: "write-code-change-pull-request-workflow",

    name: "Write Code Change Pull Request Workflow",

    description:
        "Runs the single write-code-change-pull-request skill to " +
        "commit an approved change to a fresh branch and open a " +
        "GitHub PR.",

    skills: [
        "write-code-change-pull-request",
    ],

}

export default writeCodeChangePullRequestWorkflow
