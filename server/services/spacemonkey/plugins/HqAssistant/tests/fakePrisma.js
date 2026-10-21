/**
 * Testien Prisma-korvike: lukukyselyt palauttavat annetun datan, ja
 * JOKAINEN muu kutsu (create, update, delete, upsert, $executeRaw...)
 * kirjataan ja heittää virheen. Näin testi todistaa että vain luku
 * -polku ei kirjoita mitään, eikä vain oleta sitä.
 */

const READ_METHODS = new Set([
    "findMany",
    "findUnique",
    "findFirst",
    "count",
])

export function createFakePrisma(data = {}) {

    const calls = []

    const writes = []

    // Reittitesteissä keskusteluhistorian tallennus (Conversation/
    // Message) on odotettu kirjoitus - se ei ole projektitietoa.
    const allowWrites = new Set(data.allowWrites || [])

    const projects = data.projects || []

    const handlers = {
        project: {
            findMany: async args => {
                const notDone = args?.where?.status?.not

                return projects
                    .filter(project => !notDone || project.status !== notDone)
                    .map(project => ({
                        ...project,
                        _count: { workflowSteps: project.openSteps ?? 0 },
                    }))
            },
            count: async args => {
                const notDone = args?.where?.status?.not

                return projects.filter(
                    project => !notDone || project.status !== notDone,
                ).length
            },
            findUnique: async args =>
                (data.details || {})[args?.where?.id] || null,
        },
    }

    function modelProxy(model) {
        return new Proxy({}, {
            get(_, method) {
                return async args => {
                    calls.push({ model, method, args })

                    if (!READ_METHODS.has(method) && allowWrites.has(model)) {
                        return { id: 1, ...(args?.data || {}) }
                    }

                    if (!READ_METHODS.has(method)) {
                        writes.push({ model, method })

                        throw new Error(`write attempted: ${model}.${method}`)
                    }

                    if (data.failWith) {
                        throw new Error(data.failWith)
                    }

                    const handler = handlers[model]?.[method]

                    return handler ? handler(args) : []
                }
            },
        })
    }

    const prisma = new Proxy({}, {
        get(_, key) {
            if (typeof key === "string" && key.startsWith("$")) {
                return async () => {
                    writes.push({ model: "$", method: key })

                    throw new Error(`raw access attempted: ${key}`)
                }
            }

            return modelProxy(key)
        },
    })

    return { prisma, calls, writes }

}
