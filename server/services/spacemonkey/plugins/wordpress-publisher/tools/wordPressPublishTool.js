/**
 * Wood-Booster OS
 * Boosterverse
 *
 * WordPress Publish Tool
 *
 * Luo tai päivittää WordPress-artikkelin WP REST API:n kautta.
 * Kääre olemassa olevan WordPressRESTTool-luokan ympärillä
 * (server/services/spacemonkey/packs/WordPressPack/tools/
 * WordPressRESTTool.js) - ei kirjoiteta HTTP/autentikointilogiikkaa
 * uudelleen, tehdään vain ToolBus-yhteensopivaksi.
 */

import WordPressRESTTool from "../../../packs/WordPressPack/tools/WordPressRESTTool.js"



class WordPressPublishTool {

    constructor({

        fetchImpl = fetch,

        logger = console,

    } = {}) {

        this.id = "wordpress-rest-publish"

        this.name = "WordPress REST Publish Tool"

        this.description =
            "Creates or updates a WordPress post via the WP REST API."

        this.fetch = fetchImpl

        this.logger = logger

    }

    readCredentials() {

        const baseUrl =
            process.env.WORDPRESS_BASE_URL

        const username =
            process.env.WORDPRESS_USERNAME

        const applicationPassword =
            process.env.WORDPRESS_APPLICATION_PASSWORD

        if (!baseUrl || !username || !applicationPassword) {

            return null

        }

        return {
            baseUrl,
            username,
            applicationPassword,
        }

    }

    async execute(input, runtime) {

        const {

            title,

            content,

            excerpt,

            wordpressPostStatus = "publish",

            wordpressPostId = null,

        } = input || {}

        const dryRun =
            input?.dryRun ||
            process.env.WORDPRESS_DRY_RUN === "true"

        if (dryRun) {

            this.logger?.info?.(
                "[wordpress-rest-publish] dry run - ei verkkokutsuja",
            )

            return {
                success: true,
                dryRun: true,
                postId: `dryrun-${Date.now()}`,
                permalink: "https://example.com/?p=dryrun",
            }

        }

        if (!title || !content) {

            return {
                success: false,
                code: "missing_content",
                error: "Otsikko ja sisältö vaaditaan.",
            }

        }

        const credentials = this.readCredentials()

        if (!credentials) {

            return {
                success: false,
                code: "credentials_not_configured",
                error:
                    "WordPress-sivustoa ei ole yhdistetty. Aseta " +
                    "WORDPRESS_BASE_URL, WORDPRESS_USERNAME ja " +
                    "WORDPRESS_APPLICATION_PASSWORD ympäristömuuttujiksi.",
            }

        }

        const client = new WordPressRESTTool({
            ...credentials,
            fetchImpl: this.fetch,
        })

        const body = {
            title,
            content,
            status: wordpressPostStatus,
            ...(excerpt ? { excerpt } : {}),
        }

        try {

            const result = wordpressPostId
                ? await client.update(`posts/${wordpressPostId}`, body)
                : await client.post("posts", body)

            // WordPressRESTTool ei tarkista response.ok:ta - WP:n
            // virhevastauksissa on code/message-kentät eikä
            // numeerista id:tä, joten virhe tunnistetaan siitä.
            if (!result || typeof result.id !== "number") {

                throw new Error(
                    result?.message ||
                        "WordPress REST -kutsu epäonnistui.",
                )

            }

            return {
                success: true,
                postId: result.id,
                permalink: result.link || null,
                status: result.status,
            }

        } catch (error) {

            this.logger?.error?.(
                `[wordpress-rest-publish] ${error.message}`,
            )

            return {
                success: false,
                code: "wordpress_api_error",
                error: error.message,
            }

        }

    }

}

export default WordPressPublishTool
