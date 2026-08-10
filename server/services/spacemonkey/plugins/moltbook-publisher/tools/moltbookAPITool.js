/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * Moltbook API Tool
 *
 * Matala tason kääre Moltbookin REST API:in (https://www.moltbook.com/api/v1,
 * ks. https://www.moltbook.com/skill.md). Bearer-autentikointi
 * MOLTBOOK_AGENT_API_KEY:llä. Ei koskaan heitä poikkeusta kutsujalle -
 * palauttaa aina { success, ... } tai { success:false, code, error }.
 *
 * Moltbookin oma rate limit julkaisuille on 1 postaus / 30 min - tool
 * ei yritä kiertää tätä, vaan palauttaa Moltbookin oman virheen sellaisenaan.
 */

const BASE_URL = "https://www.moltbook.com/api/v1"

// Julkaisu voi palauttaa varmistushaasteen (matikkatehtävä, ks.
// https://www.moltbook.com/skill.md), joka pitää ratkaista ja lähettää
// POST /verify:iin muutaman minuutin sisällä, tai postaus ei koskaan
// julkaistu näkyviin. Haasteen teksti on tarkoituksella "meluisa"
// (sekakirjaimet, toistetut kirjaimet, satunnaiset hakasulut).
//
// Numerot/operaattori tunnistetaan TÄSMÄHAULLA (ei sumealla
// Levenshtein-täsmäytyksellä) sen jälkeen kun toistetut kirjaimet on
// litistetty ja "y"<->"i" on kokeiltu molempiin suuntiin - kokeiltiin
// ensin yleistä sumeaa täsmäytystä, mutta se tuotti vääriä osumia
// tavallisista täytesanoista lyhyisiin sanakirjasanoihin (esim. "ter"
// täsmäsi "ten"iin, "for" täsmäsi "four"iin, "um" täsmäsi "sum"iin) -
// eli väärä mutta itsevarma vastaus, mikä on pahempi kuin rehellinen
// "en osannut ratkaista" -tulos. Täsmähaku + yksi kohdistettu
// kirjainkorvaus on kapeampi mutta turvallisempi: ei koskaan tuota
// vahingossa väärää vastausta, palauttaa vain vähemmän ratkaisuja.
const NUMBER_WORDS = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
    seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
    thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
    fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
}

const SCALE_WORDS = { hundred: 100, thousand: 1000 }

const OPERATOR_WORDS = {
    plus: "+", and: "+", add: "+", added: "+", sum: "+", total: "+",
    minus: "-", subtract: "-", less: "-",
    times: "*", multiplied: "*", multiply: "*",
    divide: "/", divided: "/", over: "/",
}

function exactMatch(token, dictionary) {

    if (Object.prototype.hasOwnProperty.call(dictionary, token)) {

        return token

    }

    // Havaittu oikeassa haasteessa: "FyVeee" -> "fyveee" -> (toisto
    // litistetty) "fyve", ei "five" - kokeillaan y<->i-korvausta.
    const swapped = token.replace(/y/g, "i")

    if (swapped !== token && Object.prototype.hasOwnProperty.call(dictionary, swapped)) {

        return swapped

    }

    return null

}

/**
 * Tulkitsee mahdollisesti "meluisan" englanninkielisen matikkatehtävän
 * ja palauttaa vastauksen, tai null jos ei voitu tulkita luottavasti.
 */
function solveMathChallenge(rawText) {

    const normalized = rawText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/([a-z])\1+/g, "$1")

    const tokens = normalized.split(/\s+/).filter(Boolean)

    const operandGroups = [[]]

    let operator = null

    for (const token of tokens) {

        if (/^\d+(\.\d+)?$/.test(token)) {

            operandGroups[operandGroups.length - 1].push(Number(token))

            continue

        }

        const numberMatch = exactMatch(token, NUMBER_WORDS)

        if (numberMatch) {

            operandGroups[operandGroups.length - 1].push(NUMBER_WORDS[numberMatch])

            continue

        }

        const scaleMatch = exactMatch(token, SCALE_WORDS)

        if (scaleMatch && operandGroups[operandGroups.length - 1].length > 0) {

            const last = operandGroups[operandGroups.length - 1].pop()

            operandGroups[operandGroups.length - 1].push(last * SCALE_WORDS[scaleMatch])

            continue

        }

        const operatorMatch = exactMatch(token, OPERATOR_WORDS)

        if (operatorMatch) {

            operator = operator || OPERATOR_WORDS[operatorMatch]

            if (operandGroups[operandGroups.length - 1].length > 0) {

                operandGroups.push([])

            }

        }

    }

    const operands = operandGroups
        .map((group) => group.reduce((sum, n) => sum + n, 0))
        .filter((n, i) => operandGroups[i].length > 0)

    if (operands.length !== 2 || !operator) {

        return null

    }

    const [a, b] = operands

    const result = {
        "+": a + b,
        "-": a - b,
        "*": a * b,
        "/": b !== 0 ? a / b : null,
    }[operator]

    return typeof result === "number" && Number.isFinite(result)
        ? result.toFixed(2)
        : null

}

class MoltbookAPITool {

    constructor({

        fetchImpl = fetch,

        logger = console,

    } = {}) {

        this.id = "moltbook-api"

        this.name = "Moltbook API Tool"

        this.description =
            "Reads the Moltbook feed and creates/publishes posts via " +
            "the Moltbook REST API."

        this.fetch = fetchImpl

        this.logger = logger

    }

    readCredentials() {

        const apiKey =
            process.env.MOLTBOOK_AGENT_API_KEY

        if (!apiKey) {

            return null

        }

        return { apiKey }

    }

    isDryRun(input) {

        return Boolean(
            input?.dryRun ||
                process.env.MOLTBOOK_DRY_RUN === "true",
        )

    }

    async request(method, path, { body, apiKey } = {}) {

        const response = await this.fetch(`${BASE_URL}${path}`, {

            method,

            headers: {

                "Authorization": `Bearer ${apiKey}`,

                ...(body ? { "Content-Type": "application/json" } : {}),

            },

            ...(body ? { body: JSON.stringify(body) } : {}),

        })

        const data = await response.json().catch(() => null)

        if (!response.ok || data?.success === false) {

            const error =
                data?.error ||
                data?.message ||
                `Moltbook API -kutsu epäonnistui (HTTP ${response.status}).`

            const apiError = new Error(error)

            apiError.code = data?.code || `http_${response.status}`

            apiError.data = data

            throw apiError

        }

        return data

    }

    /** read_feed: GET /feed (oma, personoitu syöte) */
    async getFeed({ sort = "hot", limit = 25, filter } = {}) {

        const credentials = this.readCredentials()

        if (!credentials) {

            return this.notConfigured()

        }

        try {

            const params = new URLSearchParams({ sort, limit: String(limit) })

            if (filter) params.set("filter", filter)

            const data = await this.request(
                "GET",
                `/feed?${params.toString()}`,
                credentials,
            )

            return { success: true, posts: data.posts || [], nextCursor: data.next_cursor || null }

        } catch (error) {

            return this.apiError(error, "moltbook_feed_error")

        }

    }

    /** read_feed (koko sivuston hot/new/top/rising -syöte): GET /posts */
    async getPosts({ sort = "hot", limit = 25 } = {}) {

        const credentials = this.readCredentials()

        if (!credentials) {

            return this.notConfigured()

        }

        try {

            const params = new URLSearchParams({ sort, limit: String(limit) })

            const data = await this.request(
                "GET",
                `/posts?${params.toString()}`,
                credentials,
            )

            return { success: true, posts: data.posts || [], nextCursor: data.next_cursor || null }

        } catch (error) {

            return this.apiError(error, "moltbook_posts_error")

        }

    }

    /**
     * create_post_draft / publish_post: POST /posts
     *
     * Moltbookissa ei ole erillistä draft-tilaa APIn puolella - "draft"
     * tarkoittaa tässä pluginissa sisällön koostamista Spacemonkeyn
     * puolella ennen kutsua. Kutsu itsessään julkaisee suoraan Moltbookiin.
     */
    async createPost(input = {}) {

        const {

            submoltName = "general",

            title,

            content,

            type = "text",

        } = input

        if (this.isDryRun(input)) {

            this.logger?.info?.(
                "[moltbook-api] dry run - ei verkkokutsuja",
            )

            return {
                success: true,
                dryRun: true,
                postId: `dryrun-${Date.now()}`,
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

            return this.notConfigured()

        }

        try {

            const data = await this.request(
                "POST",
                "/posts",
                {
                    ...credentials,
                    body: {
                        submolt_name: submoltName,
                        title,
                        content,
                        type,
                    },
                },
            )

            const postId = data.post?.id || data.id || null

            const verification = data.post?.verification || data.verification

            if (verification?.verification_code && verification?.challenge_text) {

                const verifyResult = await this.solveAndVerify(verification, credentials)

                return {
                    success: true,
                    postId,
                    post: data.post || data,
                    verification: verifyResult,
                }

            }

            return {
                success: true,
                postId,
                post: data.post || data,
            }

        } catch (error) {

            return this.apiError(error, "moltbook_post_error")

        }

    }

    /**
     * Ratkaisee POST /posts:in palauttaman matikkahaasteen ja lähettää
     * vastauksen POST /verify:iin. Ei koskaan estä createPostin omaa
     * onnistumista - jos haastetta ei saada ratkaistua, palautetaan
     * selkeä pending-tila jotta se on huomattavissa (postaus näkyy
     * Moltbookissa vasta kun joku - ihminen tai uusi yritys - ratkaisee
     * sen ennen verification.expires_at:ia).
     */
    async solveAndVerify(verification, credentials) {

        const answer = solveMathChallenge(verification.challenge_text)

        if (!answer) {

            this.logger?.error?.(
                `[moltbook-api] varmistushaastetta ei voitu tulkita: "${verification.challenge_text}"`,
            )

            return {
                status: "unsolved",
                code: "verification_challenge_unparseable",
                challengeText: verification.challenge_text,
                expiresAt: verification.expires_at,
            }

        }

        try {

            await this.request(
                "POST",
                "/verify",
                {
                    ...credentials,
                    body: {
                        verification_code: verification.verification_code,
                        answer,
                    },
                },
            )

            return { status: "verified", answer }

        } catch (error) {

            this.logger?.error?.(
                `[moltbook-api] varmistus epäonnistui (vastaus ${answer}): ${error.message}`,
            )

            return {
                status: "unsolved",
                code: "verification_failed",
                answer,
                error: error.message,
            }

        }

    }

    async upvotePost(postId) {

        return this.simpleAction("POST", `/posts/${postId}/upvote`, "moltbook_upvote_error")

    }

    async addComment(postId, content) {

        const credentials = this.readCredentials()

        if (!credentials) {

            return this.notConfigured()

        }

        try {

            const data = await this.request(
                "POST",
                `/posts/${postId}/comments`,
                { ...credentials, body: { content } },
            )

            return { success: true, comment: data.comment || data }

        } catch (error) {

            return this.apiError(error, "moltbook_comment_error")

        }

    }

    async getAgentProfile() {

        return this.simpleAction("GET", "/agents/me", "moltbook_profile_error")

    }

    async simpleAction(method, path, errorCode) {

        const credentials = this.readCredentials()

        if (!credentials) {

            return this.notConfigured()

        }

        try {

            const data = await this.request(method, path, credentials)

            return { success: true, ...data }

        } catch (error) {

            return this.apiError(error, errorCode)

        }

    }

    notConfigured() {

        return {
            success: false,
            code: "credentials_not_configured",
            error:
                "Moltbookia ei ole yhdistetty. Aseta " +
                "MOLTBOOK_AGENT_API_KEY ympäristömuuttujaksi.",
        }

    }

    apiError(error, fallbackCode) {

        this.logger?.error?.(`[moltbook-api] ${error.message}`)

        return {
            success: false,
            code: error.code || fallbackCode,
            error: error.message,
        }

    }

    /**
     * ToolBus-yhteensopiva yleisrajapinta. action valitsee metodin -
     * skillit kutsuvat tätä eivätkä yksittäisiä metodeja suoraan, jotta
     * ToolBus.execute("moltbook-api", { action, ... }) toimii muiden
     * Toolien tapaan.
     */
    async execute(input, runtime) {

        const { action } = input || {}

        switch (action) {

            case "get_feed":
                return this.getFeed(input)

            case "get_posts":
                return this.getPosts(input)

            case "create_post":
                return this.createPost(input)

            case "upvote_post":
                return this.upvotePost(input.postId)

            case "add_comment":
                return this.addComment(input.postId, input.content)

            case "get_profile":
                return this.getAgentProfile()

            default:
                return {
                    success: false,
                    code: "unknown_action",
                    error: `Tuntematon action: ${action}`,
                }

        }

    }

}

export default MoltbookAPITool
