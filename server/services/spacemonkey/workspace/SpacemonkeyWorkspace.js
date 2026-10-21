/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Spacemonkey Workspace (Workspace Root)
 *
 * Spacemonkeyn oma työtila: tehtävät, luonnokset, raportit,
 * kuvakaappaukset ja selaimen artefaktit. Oletussijainti on
 * XDG-yhteensopiva ~/.local/state/wood-booster-hq/spacemonkey/
 * (SPACEMONKEY_WORKSPACE_ROOT tai XDG_STATE_HOME ohittavat), ei koskaan
 * projektin versionhallitun koodin sisällä.
 *
 * "Workspace Root" ei ole Linuxin root: tämä toimii tavallisena
 * käyttäjänä. Tarkistukset ovat sovelluksen omia - ne eivät ole
 * käyttöjärjestelmän raja, koska sama käyttäjä voi lukea muitakin
 * hakemistoja. Käyttöjärjestelmätason eristys (oma käyttäjä tai kontti)
 * on erillinen myöhempi askel.
 *
 * Jokainen polku:
 * - on suhteellinen työtilan juureen; absoluuttinen, NUL-merkki ja ".."
 *   hylätään
 * - ei saa olla suojattu (security/protectedPaths.js)
 * - ratkaistaan kanoniseksi: lähimmän olemassa olevan hakemiston
 *   todellinen polku (realpath) on oltava työtilan sisällä, eikä
 *   kohde itse saa olla symlinkki
 *
 * Kirjoitus on atominen (väliaikainen tiedosto + rename), eikä se
 * ylikirjoita olemassa olevaa tiedostoa ilman overwrite-valintaa.
 * Tiedoston koko ja koko työtilan koko on rajattu.
 */

import { randomUUID } from "node:crypto"

import fs from "node:fs/promises"

import os from "node:os"

import path from "node:path"

import { isProtectedPath } from "../security/protectedPaths.js"

const SUBDIRECTORIES = [
    "tasks",
    "drafts",
    "browser",
    "screenshots",
    "traces",
    "reports",
    "exports",
]

const DEFAULT_MAX_FILE_BYTES = 5 * 1024 * 1024

const DEFAULT_MAX_TOTAL_BYTES = 200 * 1024 * 1024

const TASK_ID_PATTERN = /^\d{8}T\d{6}Z-[a-z][a-z0-9-]{0,40}-[0-9a-f]{8}$/

const TASK_KIND_PATTERN = /^[a-z][a-z0-9-]{0,40}$/

class WorkspaceError extends Error {

    constructor(code, message) {

        super(message || code)

        this.code = code

    }

}

function isInside(parent, child) {

    return child === parent || child.startsWith(parent + path.sep)

}

export function defaultWorkspaceRoot(env = process.env, home = os.homedir()) {

    if (env.SPACEMONKEY_WORKSPACE_ROOT) {
        return path.resolve(env.SPACEMONKEY_WORKSPACE_ROOT)
    }

    const stateHome =
        env.XDG_STATE_HOME && path.isAbsolute(env.XDG_STATE_HOME)
            ? env.XDG_STATE_HOME
            : path.join(home, ".local", "state")

    return path.join(stateHome, "wood-booster-hq", "spacemonkey")

}

/**
 * Palauttaa listan syistä miksi juuri ei kelpaa (tyhjä = kelpaa).
 */
export function validateWorkspaceRoot(root, { projectRoot = null, home = os.homedir() } = {}) {

    const errors = []

    if (typeof root !== "string" || !path.isAbsolute(root)) {
        return ["root must be an absolute path"]
    }

    const resolved = path.resolve(root)

    if (resolved === path.parse(resolved).root || resolved === path.resolve(home)) {
        errors.push("root cannot be the filesystem root or the home directory")
    }

    if (isProtectedPath(resolved)) {
        errors.push("root is a protected path")
    }

    if (projectRoot) {
        const project = path.resolve(projectRoot)

        if (isInside(project, resolved) || isInside(resolved, project)) {
            errors.push("root cannot be inside the project or contain it")
        }
    }

    return errors

}

class SpacemonkeyWorkspace {

    constructor({
        root = defaultWorkspaceRoot(),
        projectRoot = null,
        maxFileBytes = DEFAULT_MAX_FILE_BYTES,
        maxTotalBytes = DEFAULT_MAX_TOTAL_BYTES,
        now = () => new Date(),
    } = {}) {

        this.root = path.resolve(root)
        this.projectRoot = projectRoot ? path.resolve(projectRoot) : null
        this.maxFileBytes = maxFileBytes
        this.maxTotalBytes = maxTotalBytes
        this.now = now
        this.realRoot = null
        this.recovered = false

    }

    /**
     * Luo juuren ja vakiokansiot (0700) ja merkitsee edellisellä
     * käynnistyksellä kesken jääneet tehtävät keskeytyneiksi.
     */
    async ensure() {

        if (this.realRoot) {
            return this.realRoot
        }

        const errors = validateWorkspaceRoot(this.root, { projectRoot: this.projectRoot })

        if (errors.length > 0) {
            throw new WorkspaceError("invalid-root", errors.join("; "))
        }

        await fs.mkdir(this.root, { recursive: true, mode: 0o700 })

        const realRoot = await fs.realpath(this.root)

        const realErrors = validateWorkspaceRoot(realRoot, {
            projectRoot: this.projectRoot ? await fs.realpath(this.projectRoot) : null,
        })

        if (realErrors.length > 0) {
            throw new WorkspaceError("invalid-root", realErrors.join("; "))
        }

        for (const name of SUBDIRECTORIES) {
            await fs.mkdir(path.join(realRoot, name), { recursive: true, mode: 0o700 })
        }

        this.realRoot = realRoot

        if (!this.recovered) {
            this.recovered = true
            await this.recoverInterruptedTasks()
        }

        return realRoot

    }

    async resolve(relativePath) {

        const realRoot = await this.ensure()

        if (typeof relativePath !== "string" || relativePath.length === 0 || relativePath.includes("\0")) {
            throw new WorkspaceError("invalid-path")
        }

        if (path.isAbsolute(relativePath)) {
            throw new WorkspaceError("absolute-path")
        }

        const normalized = path.normalize(relativePath)

        if (normalized.split(path.sep).includes("..")) {
            throw new WorkspaceError("path-traversal")
        }

        if (isProtectedPath(normalized)) {
            throw new WorkspaceError("protected-path")
        }

        const absolute = path.join(realRoot, normalized)

        // Lähin olemassa oleva hakemisto ratkaistaan todelliseksi poluksi:
        // työtilaan tehty symlinkki ei saa viedä sen ulkopuolelle.
        let ancestor = path.dirname(absolute)

        while (!(await this.exists(ancestor))) {
            ancestor = path.dirname(ancestor)
        }

        if (!isInside(realRoot, await fs.realpath(ancestor))) {
            throw new WorkspaceError("outside-workspace")
        }

        const stat = await fs.lstat(absolute).catch(() => null)

        if (stat?.isSymbolicLink()) {
            throw new WorkspaceError("symlink")
        }

        return absolute

    }

    async exists(absolute) {

        try {
            await fs.lstat(absolute)
            return true
        } catch {
            return false
        }

    }

    relative(absolute) {

        return path.relative(this.realRoot, absolute)

    }

    async writeFile(relativePath, content, { overwrite = false } = {}) {

        const absolute = await this.resolve(relativePath)

        const bytes = Buffer.byteLength(content)

        if (bytes > this.maxFileBytes) {
            throw new WorkspaceError("file-too-large")
        }

        const usage = await this.usage()

        if (usage.bytes + bytes > this.maxTotalBytes) {
            throw new WorkspaceError("quota-exceeded")
        }

        await fs.mkdir(path.dirname(absolute), { recursive: true, mode: 0o700 })

        if (!isInside(this.realRoot, await fs.realpath(path.dirname(absolute)))) {
            throw new WorkspaceError("outside-workspace")
        }

        const existing = await fs.lstat(absolute).catch(() => null)

        if (existing?.isSymbolicLink()) {
            throw new WorkspaceError("symlink")
        }

        if (existing && !overwrite) {
            throw new WorkspaceError("exists")
        }

        const temporary = `${absolute}.tmp-${randomUUID()}`

        try {
            await fs.writeFile(temporary, content, { flag: "wx", mode: 0o600 })
            await fs.rename(temporary, absolute)
        } catch (error) {
            await fs.rm(temporary, { force: true })
            throw error
        }

        return { path: this.relative(absolute), bytes }

    }

    async readFile(relativePath) {

        const absolute = await this.resolve(relativePath)

        const stat = await fs.lstat(absolute).catch(() => null)

        if (!stat || !stat.isFile()) {
            throw new WorkspaceError("not-found")
        }

        if (stat.size > this.maxFileBytes) {
            throw new WorkspaceError("file-too-large")
        }

        return fs.readFile(absolute, "utf8")

    }

    async list(relativeDirectory = ".") {

        const absolute = relativeDirectory === "."
            ? await this.ensure()
            : await this.resolve(relativeDirectory)

        const entries = await fs.readdir(absolute, { withFileTypes: true })

        return entries.map(entry => ({
            name: entry.name,
            type: entry.isSymbolicLink()
                ? "link"
                : entry.isDirectory()
                    ? "directory"
                    : "file",
        }))

    }

    async usage() {

        const realRoot = await this.ensure()

        let bytes = 0

        let files = 0

        async function walk(directory) {
            const entries = await fs.readdir(directory, { withFileTypes: true }).catch(() => [])

            for (const entry of entries) {
                const child = path.join(directory, entry.name)

                if (entry.isDirectory()) {
                    await walk(child)
                } else if (entry.isFile()) {
                    const stat = await fs.lstat(child).catch(() => null)

                    bytes += stat?.size || 0
                    files += 1
                }
            }
        }

        await walk(realRoot)

        return { bytes, files, maxTotalBytes: this.maxTotalBytes }

    }

    // Tehtäväkansiot

    async createTask({ kind, label = "" } = {}) {

        if (!TASK_KIND_PATTERN.test(String(kind || ""))) {
            throw new WorkspaceError("invalid-task-kind")
        }

        const stamp = this.now().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")

        const id = `${stamp}-${kind}-${randomUUID().slice(0, 8)}`

        const meta = {
            id,
            kind,
            label: String(label).slice(0, 200),
            state: "open",
            createdAt: this.now().toISOString(),
        }

        await this.writeFile(`tasks/${id}/task.json`, JSON.stringify(meta, null, 2))

        return { id, directory: `tasks/${id}` }

    }

    taskPath(id, name = "task.json") {

        if (!TASK_ID_PATTERN.test(String(id || ""))) {
            throw new WorkspaceError("invalid-task-id")
        }

        return `tasks/${id}/${name}`

    }

    async readTask(id) {

        return JSON.parse(await this.readFile(this.taskPath(id)))

    }

    async finishTask(id, { state = "done", summary = null } = {}) {

        const meta = await this.readTask(id)

        const next = {
            ...meta,
            state,
            summary,
            finishedAt: this.now().toISOString(),
        }

        await this.writeFile(this.taskPath(id), JSON.stringify(next, null, 2), { overwrite: true })

        return next

    }

    async listTasks() {

        const entries = await this.list("tasks")

        const tasks = []

        for (const entry of entries) {
            if (entry.type !== "directory" || !TASK_ID_PATTERN.test(entry.name)) {
                continue
            }

            try {
                tasks.push(await this.readTask(entry.name))
            } catch {
                tasks.push({ id: entry.name, state: "unreadable" })
            }
        }

        return tasks.sort((first, second) => second.id.localeCompare(first.id))

    }

    /**
     * Edellisen ajon kesken jääneet ("open") tehtävät merkitään
     * keskeytyneiksi. Tiedostoja ei poisteta, jotta keskeytynyt työ on
     * tarkistettavissa.
     */
    async recoverInterruptedTasks() {

        let recovered = 0

        for (const task of await this.listTasks()) {
            if (task.state === "open") {
                await this.finishTask(task.id, {
                    state: "interrupted",
                    summary: "Tehtävä jäi kesken edellisellä ajokerralla.",
                })

                recovered += 1
            }
        }

        return recovered

    }

    async removeTask(id) {

        const absolute = await this.resolve(path.dirname(this.taskPath(id)))

        await fs.rm(absolute, { recursive: true, force: true })

        return true

    }

}

export default SpacemonkeyWorkspace

export { SUBDIRECTORIES, WorkspaceError }
