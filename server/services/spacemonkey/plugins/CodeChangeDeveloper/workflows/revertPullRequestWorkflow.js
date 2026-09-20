/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Revert Pull Request Workflow
 *
 * Ajaa revert-pull-request-skillin.
 */

const revertPullRequestWorkflow = {

    id: "revert-pull-request-workflow",

    name: "Revert Pull Request Workflow",

    description:
        "Runs the single revert-pull-request skill to open a " +
        "reverting GitHub PR against an already merged Dev Studio PR.",

    skills: [
        "revert-pull-request",
    ],

}

export default revertPullRequestWorkflow
