/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Agent Task
 *
 * Yhden Agent Runtimessa ajettavan tehtävän tila. Sama tilamalli
 * kaikille agenteille, jotta Spacemonkey voi kertoa käyttäjälle missä
 * vaiheessa tehtävä on, kuka sitä tekee ja miten se päättyi.
 *
 *   queued -> running -> succeeded | failed | cancelled | timed-out
 *   queued -> rejected (agenttia ei valittu: puuttuu, ei oikeutta,
 *                       ei toimintakunnossa)
 *
 * Päättynyttä tehtävää ei voi siirtää uuteen tilaan.
 */

import { randomUUID } from "node:crypto"

const TRANSITIONS = {
    queued: ["running", "rejected", "cancelled"],
    running: ["succeeded", "failed", "cancelled", "timed-out"],
}

const TERMINAL_STATES = new Set([
    "succeeded",
    "failed",
    "cancelled",
    "timed-out",
    "rejected",
])

class AgentTask {

    constructor({
        capabilityId = null,
        workspace = null,
        access = null,
        input = {},
        now = () => new Date(),
    } = {}) {

        this.id = randomUUID()
        this.capabilityId = capabilityId
        this.workspace = workspace
        this.access = access
        this.input = input
        this.agentId = null
        this.state = "queued"
        this.result = null
        this.error = null
        this.now = now
        this.history = [{ state: "queued", at: now().toISOString() }]
        this.controller = new AbortController()

    }

    get signal() {

        return this.controller.signal

    }

    get finished() {

        return TERMINAL_STATES.has(this.state)

    }

    transition(nextState, details = {}) {

        if (!(TRANSITIONS[this.state] || []).includes(nextState)) {
            throw new Error(
                `Invalid task transition ${this.state} -> ${nextState}`,
            )
        }

        this.state = nextState

        this.history.push({
            state: nextState,
            at: this.now().toISOString(),
            ...details,
        })

        return this

    }

    snapshot() {

        return {
            id: this.id,
            capabilityId: this.capabilityId,
            workspace: this.workspace,
            access: this.access,
            agentId: this.agentId,
            state: this.state,
            error: this.error,
            history: this.history.map(entry => ({ ...entry })),
        }

    }

}

export default AgentTask

export { TERMINAL_STATES }
