/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Architecture Importance Scorer Test
 */

import ArchitectureImportanceScorer from "../skills/analyze/ArchitectureImportanceScorer.js"


const scorer =
    new ArchitectureImportanceScorer()



const files = [

    {

        file:
            "src/App.jsx",

        role:
            "Frontend Entry Point",

        layer:
            "frontend",

        dependencyCount:
            5,

    },


    {

        file:
            "server/services/aiBrain.js",

        role:
            "Backend Service",

        layer:
            "backend",

        dependencyCount:
            4,

    },


    {

        file:
            "src/components/Button.jsx",

        role:
            "Frontend Component",

        layer:
            "frontend",

        dependencyCount:
            0,

    },


    {

        file:
            "prisma/schema.prisma",

        role:
            "Database Schema",

        layer:
            "database",

        dependencyCount:
            1,

    },

]



const result =
    files.map(
        item =>
            scorer.score(
                item
            )
    )



console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
