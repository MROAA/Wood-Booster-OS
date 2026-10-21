/**
 * Wood-Booster HQ
 * Boosterverse
 *
 * HQ Assistant Capabilities
 *
 * Kuvaa ne kyvykkyydet jotka Spacemonkey saa valita HQ-keskustelussa.
 * Ei suorita mitään (BOOSTERVERSE_SPEC.md: "Capability EI suorita
 * mitään") - suoritus kulkee aina joko rekisteröidyn workflow'n tai
 * Agent Runtimeen rekisteröidyn agentin kautta (kenttä "agent").
 *
 * Kielimalli ei koskaan keksi tai kutsu työkalua: keskustelu voi
 * käyttää vain tähän listaan kuvattua ja validoitua kyvykkyyttä, ja
 * vain jos sen workflow't tai agentti on oikeasti rekisteröity.
 *
 * access: Spacemonkeyn oikeustaso (security/accessLevels.js, V6:
 * observe, workspace, project-draft, approved-execution, privileged-os,
 * external-publishing). Keskustelu suorittaa toistaiseksi vain
 * observe-tason kyvykkyyksiä.
 */

import { ACCESS_LEVELS, isAccessLevel } from "../../../security/accessLevels.js"

const WORKSPACES = ["hq", "hearthwood"]

const REQUIRED_TEXT_FIELDS = ["id", "name", "description", "workspace", "access"]

const hqAssistantCapabilities = [

    {
        id: "hq.projects.unfinished",
        name: "Keskeneräiset projektit",
        description:
            "Listaa HQ:n projektit joiden tila ei ole Valmis, ja niiden " +
            "avoimien työvaiheiden määrän.",
        workspace: "hq",
        access: "observe",
        mutates: false,
        requiresApproval: false,
        workflows: ["hq-list-unfinished-projects-workflow"],
        requires: ["database"],
        permissions: ["hq.projects.read"],
        sources: ["Project", "ProjectWorkflowStep"],
        maturity: { level: 1, maxLevel: 4 },
    },

    {
        id: "hq.projects.summary",
        name: "Projektin yhteenveto",
        description:
            "Kokoaa avatun HQ-projektin tilan, työvaiheet, aikataulun, " +
            "tarjouksen tilan ja viimeisimmän muistiinpanon.",
        workspace: "hq",
        access: "observe",
        mutates: false,
        requiresApproval: false,
        workflows: ["hq-summarize-project-workflow"],
        requires: ["database", "active-project"],
        permissions: ["hq.projects.read"],
        sources: [
            "Project",
            "ProjectWorkflowStep",
            "ProjectTimelineTask",
            "Quote",
            "Note",
        ],
        maturity: { level: 1, maxLevel: 4 },
    },

    {
        id: "dev.python.inspect",
        name: "Python-tiedoston tarkistus",
        description:
            "Lukee projektin .py-tiedoston, tarkistaa sen syntaksin ja " +
            "rakenteen, ja pyytää Dev Studion katselmoinnin kielimallilta " +
            "jos malli on asennettu.",
        workspace: "hq",
        category: "development",
        access: "observe",
        mutates: false,
        requiresApproval: false,
        workflows: ["inspect-python-workflow", "review-python-workflow"],
        requires: ["project-files"],
        optional: ["python-review-model"],
        permissions: ["python.read"],
        sources: ["Projektin .py-tiedosto"],
        maturity: { level: 1, maxLevel: 4 },
    },

    {
        id: "dev.project.find-files",
        name: "Tiedostohaku projektista",
        description:
            "Developer Agent etsii projektista tiedostot nimen perusteella " +
            "ja kertoo mihin osaan (sivu, komponentti, palvelu...) kukin " +
            "kuuluu. Tiedostojen sisältöä ei lueta.",
        workspace: "hq",
        category: "development",
        access: "observe",
        mutates: false,
        requiresApproval: false,
        agent: "developer-agent",
        requires: ["project-files"],
        permissions: ["project.files.list"],
        sources: ["Projektin tiedostonimet"],
        maturity: { level: 1, maxLevel: 4 },
    },

    {
        id: "spacemonkey.agents.inventory",
        name: "Spacemonkeyn agentit",
        description:
            "Kertoo Spacemonkeyn agentit lähteistään: Agent Runtimen " +
            "rekisteröinnit kuntotietoineen, keskustelun kehotepersoonat, " +
            "pluginit ja koodista löytyvät agenttiluokat.",
        workspace: "hq",
        category: "spacemonkey",
        access: "observe",
        mutates: false,
        requiresApproval: false,
        workflows: ["list-spacemonkey-agents-workflow"],
        requires: ["project-files"],
        permissions: ["spacemonkey.agents.read"],
        sources: [
            "Agent Runtime",
            "server/services/agentRouter.js",
            "Plugin Manager",
            "server/index.js (import-graafi)",
        ],
        maturity: { level: 1, maxLevel: 4 },
    },

    {
        id: "hq.atlas.overview",
        name: "Project Atlas",
        description:
            "Kertoo mitä Wood-Booster HQ:ssa on rakennettu: toteutettu, " +
            "kehitteillä, suunniteltu tai epävarma, todisteista laskettuna " +
            "ja haaralla ja commitilla leimattuna. Liittää mukaan avatun " +
            "näkymän ja projektin tilanteen.",
        workspace: "hq",
        category: "spacemonkey",
        access: "observe",
        mutates: false,
        requiresApproval: false,
        workflows: ["hq-atlas-overview-workflow"],
        requires: ["project-files"],
        permissions: ["hq.atlas.read"],
        sources: [
            "Lähdekoodi (server/index.js, src/main.jsx)",
            "Git-haarat",
            "Testitiedostot",
        ],
        maturity: { level: 1, maxLevel: 4 },
    },

]

/**
 * Palauttaa listan virheistä (tyhjä = kelvollinen kuvaus).
 */
function validateChatCapability(capability) {

    const errors = []

    if (!capability || typeof capability !== "object") {
        return ["capability is not an object"]
    }

    for (const field of REQUIRED_TEXT_FIELDS) {
        if (typeof capability[field] !== "string" || !capability[field].trim()) {
            errors.push(`${field} missing`)
        }
    }

    if (!isAccessLevel(capability.access)) {
        errors.push(`unknown access level: ${capability.access}`)
    }

    if (!WORKSPACES.includes(capability.workspace)) {
        errors.push(`unknown workspace: ${capability.workspace}`)
    }

    if (typeof capability.mutates !== "boolean") {
        errors.push("mutates must be true or false")
    }

    if (typeof capability.requiresApproval !== "boolean") {
        errors.push("requiresApproval must be true or false")
    }

    if (isAccessLevel(capability.access) && ACCESS_LEVELS[capability.access].mutates === false && capability.mutates) {
        errors.push(`an ${capability.access} capability cannot mutate data`)
    }

    const hasWorkflows =
        Array.isArray(capability.workflows) &&
        capability.workflows.length > 0 &&
        capability.workflows.every(id => typeof id === "string" && id)

    const hasAgent =
        typeof capability.agent === "string" && capability.agent.trim() !== ""

    if (capability.workflows !== undefined && !hasWorkflows) {
        errors.push("workflows must list workflow ids")
    }

    if (!hasWorkflows && !hasAgent) {
        errors.push("an executor is required: workflows or agent")
    }

    if (!Array.isArray(capability.requires)) {
        errors.push("requires must be a list")
    }

    return errors

}

export default hqAssistantCapabilities

export { WORKSPACES, validateChatCapability }
