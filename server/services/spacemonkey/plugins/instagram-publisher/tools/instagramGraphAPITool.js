/**
 * Wood-Booster OS
 * Boosterverse
 *
 * Instagram Graph API Tool
 *
 * Luo media-containerit ja julkaisee ne Instagram Business -tilille
 * Meta Graph API:n Content Publishing -rajapinnalla.
 */

const DEFAULT_API_VERSION =
    process.env.META_GRAPH_API_VERSION || "v21.0"

const CONTAINER_POLL_TIMEOUT_MS = 120000

const CONTAINER_POLL_INTERVAL_MS = 3000

const MAX_CAROUSEL_ITEMS = 10



class InstagramGraphAPITool {

    constructor({

        fetchImpl = fetch,

        apiVersion = DEFAULT_API_VERSION,

        logger = console,

    } = {}) {

        this.id = "instagram-graph-publish"

        this.name = "Instagram Graph API Publish Tool"

        this.description =
            "Creates media containers and publishes them to an Instagram Business account."

        this.fetch = fetchImpl

        this.apiBase = `https://graph.facebook.com/${apiVersion}`

        this.logger = logger

    }

    readCredentials() {

        const igUserId =
            process.env.INSTAGRAM_USER_ID

        const accessToken =
            process.env.META_PAGE_ACCESS_TOKEN ||
            process.env.META_USER_ACCESS_TOKEN

        if (!igUserId || !accessToken) {

            return null

        }

        return {
            igUserId,
            accessToken,
        }

    }

    async graphRequest(path, { method = "GET", params = {} } = {}) {

        const url =
            new URL(`${this.apiBase}${path}`)

        if (method === "GET") {

            for (const [key, value] of Object.entries(params)) {

                url.searchParams.set(key, value)

            }

        }

        const response = await this.fetch(
            url.toString(),
            method === "GET"
                ? undefined
                : {
                    method,
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams(params).toString(),
                },
        )

        const body = await response.json()

        if (!response.ok || body?.error) {

            const message =
                body?.error?.message ||
                `Graph API -kutsu epäonnistui (${response.status}).`

            const error = new Error(message)

            error.graphError = body?.error || null

            throw error

        }

        return body

    }

    async createContainer({

        igUserId,

        accessToken,

        url,

        mediaType,

        caption,

        isCarouselItem = false,

    }) {

        const params = {
            access_token: accessToken,
        }

        if (mediaType === "VIDEO") {

            params.video_url = url

            params.media_type =
                isCarouselItem
                    ? "VIDEO"
                    : "REELS"

        } else {

            params.image_url = url

        }

        if (isCarouselItem) {

            params.is_carousel_item = "true"

        }

        if (caption && !isCarouselItem) {

            params.caption = caption

        }

        return this.graphRequest(
            `/${igUserId}/media`,
            { method: "POST", params },
        )

    }

    async createCarouselContainer({

        igUserId,

        accessToken,

        childrenIds,

        caption,

    }) {

        return this.graphRequest(
            `/${igUserId}/media`,
            {
                method: "POST",
                params: {
                    access_token: accessToken,
                    media_type: "CAROUSEL",
                    children: childrenIds.join(","),
                    caption: caption || "",
                },
            },
        )

    }

    async waitForContainerReady({

        containerId,

        accessToken,

        timeoutMs = CONTAINER_POLL_TIMEOUT_MS,

        intervalMs = CONTAINER_POLL_INTERVAL_MS,

    }) {

        const deadline =
            Date.now() + timeoutMs

        while (Date.now() < deadline) {

            const status = await this.graphRequest(
                `/${containerId}`,
                {
                    params: {
                        fields: "status_code",
                        access_token: accessToken,
                    },
                },
            )

            if (status.status_code === "FINISHED") {

                return true

            }

            if (
                status.status_code === "ERROR" ||
                status.status_code === "EXPIRED"
            ) {

                throw new Error(
                    `Median käsittely epäonnistui Instagramissa (${status.status_code}).`,
                )

            }

            await new Promise(
                resolve => setTimeout(resolve, intervalMs),
            )

        }

        throw new Error(
            "Median käsittely Instagramissa aikakatkaistiin.",
        )

    }

    async publishContainer({ igUserId, accessToken, creationId }) {

        return this.graphRequest(
            `/${igUserId}/media_publish`,
            {
                method: "POST",
                params: {
                    access_token: accessToken,
                    creation_id: creationId,
                },
            },
        )

    }

    async fetchPermalink({ mediaId, accessToken }) {

        const result = await this.graphRequest(
            `/${mediaId}`,
            {
                params: {
                    fields: "permalink",
                    access_token: accessToken,
                },
            },
        )

        return result.permalink || null

    }

    async execute(input, runtime) {

        const { mediaItems = [], caption = "" } = input || {}

        const dryRun =
            input?.dryRun ||
            process.env.INSTAGRAM_DRY_RUN === "true"

        if (dryRun) {

            this.logger?.info?.(
                "[instagram-graph-publish] dry run - ei verkkokutsuja",
            )

            return {
                success: true,
                dryRun: true,
                mediaId: `dryrun-${Date.now()}`,
                permalink: "https://instagram.com/p/dryrun",
            }

        }

        if (mediaItems.length === 0) {

            return {
                success: false,
                code: "no_media_selected",
                error: "Julkaisulle ei ole valittu yhtään mediatiedostoa.",
            }

        }

        if (mediaItems.length > MAX_CAROUSEL_ITEMS) {

            return {
                success: false,
                code: "too_many_media_items",
                error: `Instagram sallii korkeintaan ${MAX_CAROUSEL_ITEMS} tiedostoa yhdessä julkaisussa.`,
            }

        }

        const credentials = this.readCredentials()

        if (!credentials) {

            return {
                success: false,
                code: "credentials_not_configured",
                error:
                    "Instagram-tiliä ei ole yhdistetty. Aseta " +
                    "INSTAGRAM_USER_ID ja META_PAGE_ACCESS_TOKEN " +
                    "(tai META_USER_ACCESS_TOKEN) ympäristömuuttujiksi.",
            }

        }

        const { igUserId, accessToken } = credentials

        try {

            let creationId

            if (mediaItems.length === 1) {

                const [item] = mediaItems

                const container = await this.createContainer({
                    igUserId,
                    accessToken,
                    url: item.url,
                    mediaType: item.type,
                    caption,
                })

                if (item.type === "VIDEO") {

                    await this.waitForContainerReady({
                        containerId: container.id,
                        accessToken,
                    })

                }

                creationId = container.id

            } else {

                const childrenIds = []

                for (const item of mediaItems) {

                    const child = await this.createContainer({
                        igUserId,
                        accessToken,
                        url: item.url,
                        mediaType: item.type,
                        isCarouselItem: true,
                    })

                    if (item.type === "VIDEO") {

                        await this.waitForContainerReady({
                            containerId: child.id,
                            accessToken,
                        })

                    }

                    childrenIds.push(child.id)

                }

                const carousel = await this.createCarouselContainer({
                    igUserId,
                    accessToken,
                    childrenIds,
                    caption,
                })

                creationId = carousel.id

            }

            const published = await this.publishContainer({
                igUserId,
                accessToken,
                creationId,
            })

            const permalink = await this.fetchPermalink({
                mediaId: published.id,
                accessToken,
            }).catch(() => null)

            return {
                success: true,
                mediaId: published.id,
                permalink,
            }

        } catch (error) {

            this.logger?.error?.(
                `[instagram-graph-publish] ${error.message}`,
            )

            return {
                success: false,
                code: "graph_api_error",
                error: error.message,
                raw: error.graphError || null,
            }

        }

    }

}

export default InstagramGraphAPITool
