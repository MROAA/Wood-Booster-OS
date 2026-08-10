/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Publish Moltbook Post Workflow
 *
 * Yhden skillin workflow (sama perustelu kuin WordPress/Instagram
 * Publisherissa: WorkflowEngine ajaa kaikki workflow'n skillit
 * samalla context-oliolla).
 */

const publishMoltbookPostWorkflow = {

    id: "publish-moltbook-post-workflow",

    name: "Publish Moltbook Post Workflow",

    description:
        "Runs the single publish-moltbook-post skill.",

    skills: [
        "publish-moltbook-post",
    ],

}

export default publishMoltbookPostWorkflow
