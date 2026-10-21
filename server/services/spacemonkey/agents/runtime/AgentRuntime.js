/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Agent Runtime
 *
 * Vastaa agenttien rekisteröinnistä,
 * valinnasta ja tehtävien suorittamisesta.
 *
 * Alkuperäinen malli (find/execute) antaa tehtävän ensimmäiselle
 * agentille jonka avainsana osuu - se säilyy ennallaan. Sen rinnalla:
 *
 * - register(agent, descriptor): agentti kertoo kyvykkyytensä,
 *   työympäristönsä, oikeustasonsa, työkalunsa ja lähdetiedostonsa.
 * - health(id): agentin oma kuntotarkistus. Agenttia jolla sitä ei
 *   ole EI oleteta toimivaksi (ready: null = tuntematon).
 * - select(): deterministinen valinta kyvykkyyden perusteella
 *   (rekisteröintijärjestys), työympäristö, oikeustaso ja kunto
 *   tarkistettuina. Kieltäytymisen syy palautetaan aina.
 * - run(): sama tilamalli kaikille tehtäville (agentTask.js), aikaraja
 *   ja keskeytys. Aikarajan ylittänyt tai keskeytetty tehtävä merkitään
 *   päättyneeksi ja agentille välitetään AbortSignal - myöhässä tuleva
 *   tulos jätetään huomiotta.
 */

import AgentTask from "./agentTask.js"

import {
    ACCESS_LEVELS,
    isAccessAllowed,
    isAccessLevel,
} from "../../security/accessLevels.js"

const DEFAULT_TIMEOUT_MS = 30000

const DEFAULT_ALLOWED_ACCESS = ["observe"]

class TaskTimeoutError extends Error {}

class TaskCancelledError extends Error {}

function rejectOnAbort(signal) {

    return new Promise((_, reject) => {
        signal.addEventListener(
            "abort",
            () => reject(new TaskCancelledError("cancelled")),
            { once: true },
        )
    })

}

class AgentRuntime {

    constructor({
        logger = console,
        maxTaskHistory = 50,
    } = {}) {

        this.logger = logger
        this.agents = new Map()
        this.descriptors = new Map()
        this.tasks = new Map()
        this.maxTaskHistory = maxTaskHistory

    }

    register(agent, descriptor = null) {

        if (!agent?.id) {
            throw new Error("Agent id missing.")
        }

        this.agents.set(agent.id, agent)

        if (descriptor) {
            this.descriptors.set(
                agent.id,
                this.normalizeDescriptor(agent, descriptor),
            )
        }

        this.logger.info?.(
            `Agent registered: ${agent.id}`
        )

        return agent

    }

    normalizeDescriptor(agent, descriptor) {

        const capabilities = []

        for (const capability of descriptor.capabilities || []) {

            if (!capability?.id || !isAccessLevel(capability.access)) {
                this.logger.warn?.(
                    `[agent-runtime] ${agent.id}: capability ` +
                    `${capability?.id} skipped (id or access level missing)`,
                )
                continue
            }

            capabilities.push({
                id: capability.id,
                name: capability.name || capability.id,
                access: capability.access,
                mutates: ACCESS_LEVELS[capability.access].mutates,
            })

        }

        return {
            id: agent.id,
            name: descriptor.name || agent.name || agent.id,
            purpose: descriptor.purpose || "",
            source: descriptor.source || null,
            workspaces: descriptor.workspaces || [],
            capabilities,
            tools: descriptor.tools || [],
            permissions: descriptor.permissions || [],
            mutates: capabilities.some(capability => capability.mutates),
            tests: descriptor.tests || [],
            overlapsWith: descriptor.overlapsWith || [],
        }

    }

    unregister(id) {

        this.descriptors.delete(id)

        return this.agents.delete(id)

    }

    list() {

        return [...this.agents.values()]

    }

    find(task) {

        for (const agent of this.agents.values()) {

            if (
                typeof agent.canHandle === "function" &&
                agent.canHandle(task)
            ) {
                return agent
            }

        }

        return null

    }

    async execute(task) {

        const agent = this.find(task)

        if (!agent) {

            return {

                success: false,

                error: "No suitable agent found.",

                task,

            }

        }

        this.logger.info?.(
            `Selected agent: ${agent.id}`
        )

        return await agent.execute(task)

    }

    health(id) {

        const agent = this.agents.get(id)

        if (!agent) {
            return { ready: false, missing: ["agent-not-registered"] }
        }

        if (typeof agent.health !== "function") {
            return { ready: null, missing: [], note: "no health check" }
        }

        try {
            const result = agent.health()

            return {
                ready: result?.ready === true,
                missing: Array.isArray(result?.missing) ? result.missing : [],
            }
        } catch (error) {
            return {
                ready: false,
                missing: [`health-check-failed: ${error.message}`],
            }
        }

    }

    describe() {

        return this.list().map(agent => {
            const descriptor = this.descriptors.get(agent.id) || null

            return {
                id: agent.id,
                name: descriptor?.name || agent.name || agent.id,
                described: Boolean(descriptor),
                ...(descriptor || {}),
                health: this.health(agent.id),
            }
        })

    }

    select({
        capabilityId,
        workspace = null,
        allowedAccess = DEFAULT_ALLOWED_ACCESS,
    } = {}) {

        if (!capabilityId) {
            return { agent: null, code: "capability-missing", reasons: [] }
        }

        const reasons = []

        for (const descriptor of this.descriptors.values()) {

            const capability = descriptor.capabilities.find(
                item => item.id === capabilityId,
            )

            if (!capability) {
                continue
            }

            if (workspace && !descriptor.workspaces.includes(workspace)) {
                reasons.push({ agentId: descriptor.id, reason: "other-workspace" })
                continue
            }

            if (!isAccessAllowed(capability.access, allowedAccess)) {
                reasons.push({ agentId: descriptor.id, reason: "access-not-allowed" })
                continue
            }

            const health = this.health(descriptor.id)

            if (health.ready !== true) {
                reasons.push({
                    agentId: descriptor.id,
                    reason: "not-ready",
                    missing: health.missing,
                })
                continue
            }

            return {
                agent: this.agents.get(descriptor.id),
                descriptor,
                capability,
                reasons,
            }

        }

        return {
            agent: null,
            code: reasons[0]?.reason || "no-agent-for-capability",
            reasons,
        }

    }

    remember(task) {

        this.tasks.set(task.id, task)

        while (this.tasks.size > this.maxTaskHistory) {

            const oldest = [...this.tasks.values()].find(item => item.finished)

            if (!oldest) {
                break
            }

            this.tasks.delete(oldest.id)

        }

    }

    async run({
        capabilityId,
        workspace = null,
        allowedAccess = DEFAULT_ALLOWED_ACCESS,
        input = {},
        timeoutMs = DEFAULT_TIMEOUT_MS,
    } = {}) {

        const task = new AgentTask({ capabilityId, workspace, input })

        this.remember(task)

        const selection = this.select({ capabilityId, workspace, allowedAccess })

        if (!selection.agent) {
            task.error = selection.code
            task.transition("rejected", { reason: selection.code })

            return { ...task.snapshot(), result: null, reasons: selection.reasons }
        }

        task.agentId = selection.agent.id
        task.access = selection.capability.access
        task.transition("running", { agentId: task.agentId })

        let timer = null

        try {
            const outcome = await Promise.race([
                selection.agent.execute({
                    ...input,
                    capabilityId,
                    workspace,
                    access: selection.capability.access,
                    taskId: task.id,
                    signal: task.signal,
                }),
                new Promise((_, reject) => {
                    timer = setTimeout(
                        () => reject(new TaskTimeoutError("timeout")),
                        timeoutMs,
                    )
                }),
                rejectOnAbort(task.signal),
            ])

            if (!task.finished) {
                task.result = outcome

                if (outcome?.success === false) {
                    task.error = outcome.error || outcome.status || "agent-failed"
                    task.transition("failed")
                } else {
                    task.transition("succeeded")
                }
            }
        } catch (error) {
            if (!task.finished) {
                if (error instanceof TaskTimeoutError) {
                    task.error = "timeout"
                    task.transition("timed-out", { timeoutMs })
                    task.controller.abort()
                } else {
                    task.error = error.message
                    task.transition("failed")
                }
            }
        } finally {
            clearTimeout(timer)
        }

        return { ...task.snapshot(), result: task.result }

    }

    cancel(taskId) {

        const task = this.tasks.get(taskId)

        if (!task || task.finished) {
            return false
        }

        task.error = "cancelled"
        task.transition("cancelled")
        task.controller.abort()

        return true

    }

    getTask(taskId) {

        return this.tasks.get(taskId)?.snapshot() || null

    }

    listTasks() {

        return [...this.tasks.values()].reverse().map(task => task.snapshot())

    }

    summary() {

        return {

            totalAgents:
                this.agents.size,

            agents:
                [...this.agents.keys()],

        }

    }

}

export default AgentRuntime

export { DEFAULT_TIMEOUT_MS }
