/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Code Dependency Graph Builder Test
 */

import CodeDependencyGraphBuilder from "../skills/analyze/CodeDependencyGraphBuilder.js"


const builder =
    new CodeDependencyGraphBuilder()



const dependencyData = [

    {
        file:
            "src/App.jsx",

        imports: [

            "./pages/Dashboard.jsx",

            "./pages/SystemPulse.jsx",

        ],

        exports: [

            "default",

        ],

    },


    {
        file:
            "src/pages/Dashboard.jsx",

        imports: [

            "../components/StatCard.jsx",

        ],

        exports: [

            "default",

        ],

    },


    {
        file:
            "src/pages/SystemPulse.jsx",

        imports: [

            "../components/systemPulse/SnapshotCard.jsx",

        ],

        exports: [

            "default",

        ],

    },

]



const result =
    builder.build(
        dependencyData
    )


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
