/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Project Understanding Analyzer Test
 */

import ProjectUnderstandingAnalyzer from "../skills/analyze/ProjectUnderstandingAnalyzer.js"


const analyzer =
    new ProjectUnderstandingAnalyzer()


const structure = {

    frontend: {
        detected: true,
        path: "src/",
    },

    backend: {
        detected: true,
        path: "server/",
    },

    database: {
        detected: true,
        path: "prisma/",
    },

    documentation: {
        detected: true,
        path: "docs/",
    },

}


const result =
    analyzer.analyze(
        structure
    )


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
