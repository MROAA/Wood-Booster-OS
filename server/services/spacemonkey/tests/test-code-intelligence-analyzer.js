/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Code Intelligence Analyzer Test
 */

import CodeIntelligenceAnalyzer from "../skills/analyze/CodeIntelligenceAnalyzer.js"


const analyzer =
    new CodeIntelligenceAnalyzer()


const files = [

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/pages/Dashboard.jsx",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/components/Sidebar.jsx",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/routes/projects.js",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/services/aiBrain.js",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/prisma/schema.prisma",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/vite.config.js",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/test-example.js",

]


const result =
    analyzer.analyze(
        files
    )


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
