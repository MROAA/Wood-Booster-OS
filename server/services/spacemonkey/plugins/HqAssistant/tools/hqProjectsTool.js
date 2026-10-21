/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * HQ Projects Tool
 *
 * Ainoa HQ Assistant -pluginin työkalu joka koskee HQ:n projekti-
 * tietoihin. Vain luku: kutsuu Prismasta ainoastaan findMany/
 * findUnique/count-kyselyjä, eikä sillä ole yhtään kirjoittavaa
 * toimintoa - kirjoittavat projektitoiminnot eivät kuulu Sprint 1:een.
 *
 * Kentät valitaan aina erikseen (select), jotta vastaukseen ei
 * päädy esim. asiakkaan sähköpostia tai puhelinnumeroa (PRD:n
 * "hae vain tehtävän kannalta tarpeellinen tieto").
 *
 * Prisma tulee ToolBusin runtime-argumenttina - työkalu itse on
 * tilaton.
 */

const DONE_STATUS = "Valmis"

const MAX_PROJECTS = 50

const NOTE_EXCERPT_LENGTH = 200

function toProjectId(value) {

    const id = Number(value)

    return Number.isInteger(id) && id > 0
        ? id
        : null

}

async function listUnfinished(prisma) {

    const where = {
        status: { not: DONE_STATUS },
    }

    const [projects, total] = await Promise.all([
        prisma.project.findMany({
            where,
            orderBy: { updatedAt: "desc" },
            take: MAX_PROJECTS,
            select: {
                id: true,
                name: true,
                status: true,
                deadline: true,
                updatedAt: true,
                _count: {
                    select: {
                        workflowSteps: { where: { done: false } },
                    },
                },
            },
        }),
        prisma.project.count({ where }),
    ])

    return {
        total,
        truncated: total > projects.length,
        projects: projects.map(project => ({
            id: project.id,
            name: project.name,
            status: project.status,
            deadline: project.deadline,
            updatedAt: project.updatedAt,
            openSteps: project._count?.workflowSteps ?? 0,
        })),
    }

}

async function summarizeProject(prisma, { projectId }) {

    const id = toProjectId(projectId)

    if (!id) {
        return {
            success: false,
            code: "invalid_project_id",
            error: "Projektin tunniste puuttuu tai on virheellinen.",
        }
    }

    const project = await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            status: true,
            deadline: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            customer: { select: { name: true, company: true } },
            workflowSteps: {
                orderBy: { id: "asc" },
                select: { id: true, title: true, done: true },
            },
            timelineTasks: {
                orderBy: { id: "asc" },
                select: { id: true, name: true, deadline: true, completed: true },
            },
            quote: { select: { quoteNumber: true, status: true } },
            projectNotes: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { title: true, content: true, createdAt: true },
            },
            _count: {
                select: { materials: true, files: true, projectNotes: true },
            },
        },
    })

    if (!project) {
        return {
            success: false,
            code: "project_not_found",
            error: `Projektia #${id} ei löytynyt.`,
        }
    }

    const latestNote = project.projectNotes?.[0] || null

    return {
        project: {
            id: project.id,
            name: project.name,
            status: project.status,
            deadline: project.deadline,
            description: project.description,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            customerName:
                project.customer?.company ||
                project.customer?.name ||
                null,
            workflowSteps: project.workflowSteps,
            timelineTasks: project.timelineTasks,
            quote: project.quote,
            latestNote: latestNote
                ? {
                    title: latestNote.title,
                    createdAt: latestNote.createdAt,
                    excerpt: latestNote.content.slice(0, NOTE_EXCERPT_LENGTH),
                }
                : null,
            counts: {
                materials: project._count?.materials ?? 0,
                files: project._count?.files ?? 0,
                notes: project._count?.projectNotes ?? 0,
            },
        },
    }

}

const READ_ACTIONS = {
    "list-unfinished": listUnfinished,
    summary: summarizeProject,
}

const hqProjectsTool = {

    id: "hq-projects",

    name: "HQ Projects (read-only)",

    description:
        "Reads Wood-Booster HQ projects: unfinished projects and a " +
        "single project's summary. Read-only - has no write actions.",

    readOnly: true,

    actions: Object.keys(READ_ACTIONS),

    async execute(input = {}, runtime = null) {

        const prisma = runtime?.prisma

        if (!prisma) {
            return {
                success: false,
                code: "database_unavailable",
                error: "HQ:n tietokanta ei ole käytettävissä.",
            }
        }

        const handler = READ_ACTIONS[input.action]

        if (!handler) {
            return {
                success: false,
                code: "unknown_action",
                error: `Tuntematon toiminto: ${input.action}`,
            }
        }

        try {
            const result = await handler(prisma, input)

            return result.success === false
                ? result
                : { success: true, ...result }
        } catch (error) {
            return {
                success: false,
                code: "query_failed",
                error: error.message,
            }
        }

    },

}

export default hqProjectsTool

export { DONE_STATUS, MAX_PROJECTS }
