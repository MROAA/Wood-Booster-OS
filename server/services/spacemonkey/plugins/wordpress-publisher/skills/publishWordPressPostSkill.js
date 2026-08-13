/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Publish WordPress Post Skill
 *
 * Lukee hyväksytyn BlogPostDraftin ja kutsuu WordPress Publish
 * Toolia. Ei koskaan aja hyväksymätöntä luonnosta - kutsujan
 * (reitin) vastuulla on tarkistaa status ennen suoritusta.
 */

const publishWordPressPostSkill = {

    id: "publish-wordpress-post",

    name: "Publish WordPress Post",

    description:
        "Reads an approved BlogPostDraft and calls the WordPress " +
        "REST Publish Tool.",

    async execute(context) {

        const { draftId, prisma, toolBus } = context || {}

        const draft = await prisma.blogPostDraft.findUnique({
            where: { id: draftId },
        })

        if (!draft) {

            return {
                success: false,
                code: "draft_not_found",
                error: "Blogiluonnosta ei löytynyt.",
            }

        }

        if (draft.status !== "approved") {

            return {
                success: false,
                code: "draft_not_approved",
                error: `Luonnos ei ole hyväksytty (status: ${draft.status}).`,
            }

        }

        return toolBus.execute(
            "wordpress-rest-publish",
            {
                title: draft.title,
                content: draft.content,
                excerpt: draft.excerpt || undefined,
                wordpressPostStatus: draft.wordpressPostStatus,
                wordpressPostId: draft.wordpressPostId || null,
            },
        )

    },

}

export default publishWordPressPostSkill
