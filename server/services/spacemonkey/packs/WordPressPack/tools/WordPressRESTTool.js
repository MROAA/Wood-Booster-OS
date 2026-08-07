/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * WordPress REST Tool
 *
 * Keskitetty rajapinta WordPress REST API:lle.
 */

class WordPressRESTTool {

    constructor({
        baseUrl,
        username,
        applicationPassword,
        fetchImpl = fetch,
    } = {}) {

        this.baseUrl = baseUrl?.replace(/\/$/, "")

        this.username = username

        this.applicationPassword = applicationPassword

        this.fetch = fetchImpl
    }

    headers() {

        const token = Buffer
            .from(
                `${this.username}:${this.applicationPassword}`
            )
            .toString("base64")

        return {

            "Content-Type":
                "application/json",

            Authorization:
                `Basic ${token}`,

        }
    }

    async get(endpoint) {

        const response =
            await this.fetch(

                `${this.baseUrl}/wp-json/wp/v2/${endpoint}`,

                {
                    headers:
                        this.headers(),
                }

            )

        return response.json()
    }

    async post(endpoint, body = {}) {

        const response =
            await this.fetch(

                `${this.baseUrl}/wp-json/wp/v2/${endpoint}`,

                {

                    method: "POST",

                    headers:
                        this.headers(),

                    body:
                        JSON.stringify(body),

                }

            )

        return response.json()
    }

    async update(endpoint, body = {}) {

        const response =
            await this.fetch(

                `${this.baseUrl}/wp-json/wp/v2/${endpoint}`,

                {

                    method: "POST",

                    headers:
                        this.headers(),

                    body:
                        JSON.stringify(body),

                }

            )

        return response.json()
    }

    async delete(endpoint) {

        const response =
            await this.fetch(

                `${this.baseUrl}/wp-json/wp/v2/${endpoint}`,

                {

                    method: "DELETE",

                    headers:
                        this.headers(),

                }

            )

        return response.json()
    }

}

export default WordPressRESTTool
