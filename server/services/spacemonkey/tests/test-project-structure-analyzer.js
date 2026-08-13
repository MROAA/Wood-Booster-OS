import ProjectStructureAnalyzer from "../skills/analyze/ProjectStructureAnalyzer.js"


const analyzer =
    new ProjectStructureAnalyzer({})


const result =
    analyzer.analyze([

        "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/components/App.jsx",

        "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/index.js",

        "/home/marc/Wood-Booster-AI/Wood-Booster-OS/prisma/schema.prisma",

        "/home/marc/Wood-Booster-AI/Wood-Booster-OS/docs/ARCHITECTURE.md",

    ])


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
