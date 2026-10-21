/**
 * Wood-Booster HQ
 * Ollama Model Resolver
 *
 * Kertoo mikä ASENNETTU malli vastaa. Mallia ei koskaan oleteta
 * olemassa olevaksi: konfiguroitu malli kelpaa vain jos Ollama sen
 * tuntee, muuten ensimmäinen asennettu malli annetusta listasta.
 *
 * Syy: AI Brainin kovakoodattu oletus qwen2.5:7b ei ole asennettu
 * Marcin koneelle (vain -coder-versiot ja poro), joten HQ-chatin jokainen
 * vapaa kysymys päättyi "model not found" -virheeseen ja tyhjään
 * vastaukseen.
 *
 * Ei lataa mallia eikä kutsu chat-rajapintaa - lukee vain /api/tags.
 */

const OLLAMA_URL = (
    process.env.OLLAMA_URL ||
    "http://127.0.0.1:11434"
).replace(/\/+$/, "")

const TAGS_TIMEOUT_MS = 4000

const withTag = name =>
    String(name).includes(":")
        ? String(name)
        : `${name}:latest`

/**
 * Asennettujen mallien nimet tagin kanssa, tai null jos Ollama ei vastaa.
 */
export async function listInstalledModels({ fetchImpl = fetch } = {}) {
    try {
        const response = await fetchImpl(`${OLLAMA_URL}/api/tags`, {
            signal: AbortSignal.timeout(TAGS_TIMEOUT_MS),
        })

        if (!response.ok) {
            return null
        }

        const data = await response.json()

        return (data.models || [])
            .map(model => model?.name || model?.model)
            .filter(Boolean)
            .map(withTag)
    } catch {
        return null
    }
}

/**
 * { model, source } tai { model: null, reason, message }. Viesti on
 * selkeää suomea ja näytetään käyttäjälle sellaisenaan.
 */
export async function resolveInstalledModel({
    configured = null,
    preferred = [],
    fetchImpl = fetch,
} = {}) {
    const installed = await listInstalledModels({ fetchImpl })

    if (!installed) {
        return {
            model: null,
            reason: "ollama-unreachable",
            message: "Paikallinen tekoälypalvelu (Ollama) ei vastaa.",
        }
    }

    if (configured) {
        return installed.includes(withTag(configured))
            ? { model: configured, source: "config" }
            : {
                model: null,
                reason: "configured-model-missing",
                message:
                    `Asetuksissa valittua kielimallia ${configured} ` +
                    "ei ole asennettu.",
            }
    }

    const found = preferred.find(name => installed.includes(withTag(name)))

    return found
        ? { model: found, source: "installed" }
        : {
            model: null,
            reason: "no-model",
            message: "Koneelle ei ole asennettu sopivaa kielimallia.",
        }
}

/**
 * Sama tulos lyhyen hetken välimuistissa, jotta keskustelu ei kysy
 * Ollamalta jokaisella viestillä. Injektoitu fetch (testit) ohittaa
 * välimuistin aina.
 */
export function createCachedModelResolver({
    configured = null,
    preferred = [],
    cacheMs = 30000,
} = {}) {
    let cache = { at: 0, value: null }

    return async function resolve({ fetchImpl } = {}) {
        if (fetchImpl) {
            return resolveInstalledModel({ configured, preferred, fetchImpl })
        }

        if (!cache.value || Date.now() - cache.at > cacheMs) {
            cache = {
                at: Date.now(),
                value: await resolveInstalledModel({ configured, preferred }),
            }
        }

        return cache.value
    }
}
