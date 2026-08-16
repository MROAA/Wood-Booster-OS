/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Write Python Code Pull Request Workflow
 *
 * Ajaa write-python-pull-request-skillin.
 */

const writePythonCodePullRequestWorkflow = {

    id: "write-python-pull-request-workflow",

    name: "Write Python Code Pull Request Workflow",

    description:
        "Runs the single write-python-pull-request skill to commit " +
        "an approved Python draft to a fresh branch and open a " +
        "GitHub PR.",

    skills: [
        "write-python-pull-request",
    ],

}

export default writePythonCodePullRequestWorkflow
