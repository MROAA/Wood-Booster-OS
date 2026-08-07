/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Architecture Role Detector Test
 */

import ArchitectureRoleDetector from "../skills/analyze/ArchitectureRoleDetector.js"


const detector =
    new ArchitectureRoleDetector()



const files = [

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/App.jsx",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/pages/Dashboard.jsx",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/components/Sidebar.jsx",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/routes/projects.js",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/server/services/aiBrain.js",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/prisma/schema.prisma",

    "/home/marc/Wood-Booster-AI/Wood-Booster-OS/tests/example.test.js",

]



const result =
    files.map(
        file => ({

            file,

            architecture:
                detector.detect(
                    file
                ),

        })
    )



console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
