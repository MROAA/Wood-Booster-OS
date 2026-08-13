/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Publish Instagram Post Skill
 *
 * Lukee hyväksytyn SocialPostDraftin ja sen valitut ProjectFilet,
 * muodostaa niistä julkiset media-URL:t, ja kutsuu Instagram Graph
 * API Toolia. Ei koskaan aja hyväksymätöntä luonnosta - kutsujan
 * (reitin) vastuulla on tarkistaa status ennen suoritusta.
 */

const MAX_CAROUSEL_ITEMS = 10



function resolveMediaType(mimeType) {

    return mimeType?.startsWith("video/")
        ? "VIDEO"
        : "IMAGE"

}



const publishInstagramPostSkill = {

    id: "publish-instagram-post",

    name: "Publish Instagram Post",

    description:
        "Reads an approved SocialPostDraft and its selected " +
        "ProjectFiles, resolves public media URLs, and calls the " +
        "Instagram Graph API Tool.",

    async execute(context) {

        const { draftId, prisma, toolBus } = context || {}

        const draft = await prisma.socialPostDraft.findUnique({
            where: { id: draftId },
        })

        if (!draft) {

            return {
                success: false,
                code: "draft_not_found",
                error: "Julkaisuluonnosta ei löytynyt.",
            }

        }

        if (draft.status !== "approved") {

            return {
                success: false,
                code: "draft_not_approved",
                error: `Luonnos ei ole hyväksytty (status: ${draft.status}).`,
            }

        }

        let fileIds = []

        try {

            fileIds = JSON.parse(draft.selectedFileIds || "[]")

        } catch {

            fileIds = []

        }

        if (fileIds.length === 0) {

            return {
                success: false,
                code: "no_media_selected",
                error: "Luonnokselle ei ole valittu yhtään tiedostoa.",
            }

        }

        if (fileIds.length > MAX_CAROUSEL_ITEMS) {

            return {
                success: false,
                code: "too_many_media_items",
                error: `Instagram sallii korkeintaan ${MAX_CAROUSEL_ITEMS} tiedostoa yhdessä julkaisussa.`,
            }

        }

        const files = await prisma.projectFile.findMany({
            where: { id: { in: fileIds } },
        })

        const filesById = new Map(
            files.map(file => [file.id, file]),
        )

        const orderedFiles = fileIds
            .map(id => filesById.get(id))
            .filter(Boolean)

        if (orderedFiles.length !== fileIds.length) {

            return {
                success: false,
                code: "media_not_found",
                error: "Osaa valituista tiedostoista ei löytynyt.",
            }

        }

        const publicBaseUrl = process.env.PUBLIC_BASE_URL

        if (!publicBaseUrl) {

            return {
                success: false,
                code: "public_base_url_missing",
                error:
                    "Aseta PUBLIC_BASE_URL julkiseen, Metan " +
                    "palvelimilta tavoitettavaan HTTPS-osoitteeseen " +
                    "ennen julkaisua.",
            }

        }

        const mediaItems = orderedFiles.map(file => ({
            url: `${publicBaseUrl.replace(/\/$/, "")}/uploads/projects/${file.projectId}/${file.storedName}`,
            type: resolveMediaType(file.mimeType),
        }))

        const dryRun =
            process.env.INSTAGRAM_DRY_RUN === "true"

        if (!dryRun) {

            const unreachable = []

            for (const item of mediaItems) {

                try {

                    const response = await fetch(
                        item.url,
                        { method: "HEAD" },
                    )

                    if (!response.ok) {

                        unreachable.push(item.url)

                    }

                } catch {

                    unreachable.push(item.url)

                }

            }

            if (unreachable.length > 0) {

                return {
                    success: false,
                    code: "media_unreachable",
                    error:
                        "Seuraavat mediaosoitteet eivät olleet " +
                        "tavoitettavissa palvelimelta itseltään " +
                        "(tämä ei todista että Metan palvelimet " +
                        "tavoittavat ne): " + unreachable.join(", "),
                    unreachableUrls: unreachable,
                }

            }

        }

        const caption = [draft.caption, draft.hashtags]
            .filter(Boolean)
            .join("\n\n")

        return toolBus.execute(
            "instagram-graph-publish",
            { mediaItems, caption },
        )

    },

}

export default publishInstagramPostSkill
