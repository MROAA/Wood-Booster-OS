/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Dependency Resolver Test
 */

import DependencyResolver from "../skills/analyze/DependencyResolver.js"


const resolver =
    new DependencyResolver()



const result =
    await resolver.resolve({

        file:
            "/home/marc/Wood-Booster-AI/Wood-Booster-OS/src/App.jsx",

        imports: [

            "./pages/Dashboard",

            "./pages/SystemPulse",

            "react",

        ],

    })



console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
