/**
 * Wood-Booster OS
 * Boosterverse
 *
 * Publish WordPress Post Workflow
 *
 * Ajaa publish-wordpress-post-skillin annetulle hyväksytylle
 * BlogPostDraftille.
 *
 * Tarkoituksella yhden skillin workflow, samasta syystä kuin
 * Instagram Publisherissa: WorkflowEngine ajaa kaikki workflow'n
 * skillit SAMALLA context-oliolla eikä ketjuta yhden skillin
 * tulosta seuraavan syötteeksi.
 */

const publishWordPressPostWorkflow = {

    id: "publish-wordpress-post-workflow",

    name: "Publish WordPress Post Workflow",

    description:
        "Runs the single publish-wordpress-post skill for an " +
        "approved BlogPostDraft.",

    skills: [
        "publish-wordpress-post",
    ],

}

export default publishWordPressPostWorkflow
