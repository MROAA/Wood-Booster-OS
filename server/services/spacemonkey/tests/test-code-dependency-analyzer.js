/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Code Dependency Analyzer Test
 */

import path from "node:path"

import { fileURLToPath } from "node:url"

import CodeDependencyAnalyzer from "../skills/analyze/CodeDependencyAnalyzer.js"

// tests/ -> spacemonkey -> services -> server -> repo root. Ei
// kiinteää /home/marc-polkua - se toimi vain sattumalta Marcin
// omalla koneella (päächeckout sattuu aina olemaan täsmälleen siinä
// polussa), mutta ei missään muualla, esim. GitHub Actions -ajureilla
// (havaittu ensimmäisen oikean CI-ajon kaatuessa ENOENT:iin).
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

const PROJECT_ROOT = path.resolve(currentDirectory, "../../../..")


const analyzer =
    new CodeDependencyAnalyzer()


const files = [

    path.join(PROJECT_ROOT, "server/services/spacemonkey/agents/developer/DeveloperAgent.js"),

    path.join(PROJECT_ROOT, "server/services/spacemonkey/workflows/developer/DeveloperWorkflow.js"),

    path.join(PROJECT_ROOT, "src/App.jsx"),

]



const result =
    await analyzer.analyze(
        files
    )


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
