/**
 * Wood-Booster HQ
 * Spacemonkey
 *
 * Code Dependency Analyzer Test
 */

import CodeDependencyAnalyzer from "../skills/analyze/CodeDependencyAnalyzer.js"


const analyzer =
    new CodeDependencyAnalyzer()


const files = [

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/services/spacemonkey/agents/developer/DeveloperAgent.js",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/services/spacemonkey/workflows/developer/DeveloperWorkflow.js",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/App.jsx",

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
