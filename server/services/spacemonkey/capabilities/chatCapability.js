/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Chat Capability Contract
 *
 * Mitä keskustelussa valittavan kyvykkyyden kuvauksessa pitää olla, ja
 * sen validointi. Jaettu kaikille plugineille jotka rekisteröivät
 * kyvykkyyksiä Capability Registryyn (HqAssistant, SystemOperator) -
 * kielimalli ei koskaan valitse kuvausta joka ei läpäise tätä.
 */

import { ACCESS_LEVELS, isAccessLevel } from "../security/accessLevels.js"

const WORKSPACES = ["hq", "hearthwood"]

const REQUIRED_TEXT_FIELDS = ["id", "name", "description", "workspace", "access"]

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

export { WORKSPACES, validateChatCapability }
