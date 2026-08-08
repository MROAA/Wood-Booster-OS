/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Publish Instagram Post Workflow
 *
 * Ajaa publish-instagram-post-skillin annetulle hyväksytylle
 * SocialPostDraftille.
 *
 * Tarkoituksella yhden skillin workflow: WorkflowEngine ajaa kaikki
 * workflow'n skillit SAMALLA context-oliolla eikä ketjuta yhden
 * skillin tulosta seuraavan syötteeksi, joten "hae luonnos" ja
 * "kutsu Toolia" pitäminen yhtenä skillinä on tämän moottorin
 * mallille luontevin ratkaisu.
 */

const publishInstagramPostWorkflow = {

    id: "publish-instagram-post-workflow",

    name: "Publish Instagram Post Workflow",

    description:
        "Runs the single publish-instagram-post skill for an " +
        "approved SocialPostDraft.",

    skills: [
        "publish-instagram-post",
    ],

}

export default publishInstagramPostWorkflow
