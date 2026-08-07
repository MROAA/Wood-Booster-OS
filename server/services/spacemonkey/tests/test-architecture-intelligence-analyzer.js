/**
 * Wood-Booster OS
 * Spacemonkey
 *
 * Architecture Intelligence Analyzer Test
 */

import ArchitectureIntelligenceAnalyzer from "../skills/analyze/ArchitectureIntelligenceAnalyzer.js"


const analyzer =
    new ArchitectureIntelligenceAnalyzer()



const graph = {

    nodes: [

        {
            id:
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
            id:
                "src/pages/Dashboard.jsx",

            imports: [

                "../components/StatCard.jsx",

            ],

            exports: [

                "default",

            ],

        },


        {
            id:
                "src/pages/SystemPulse.jsx",

            imports: [

                "../components/systemPulse/SnapshotCard.jsx",

            ],

            exports: [

                "default",

            ],

        },

    ],


    edges: [

        {
            from:
                "src/App.jsx",

            to:
                "src/pages/Dashboard.jsx",

        },

        {
            from:
                "src/App.jsx",

            to:
                "src/pages/SystemPulse.jsx",

        },

        {
            from:
                "src/pages/Dashboard.jsx",

            to:
                "src/components/StatCard.jsx",

        },

        {
            from:
                "src/pages/SystemPulse.jsx",

            to:
                "src/components/systemPulse/SnapshotCard.jsx",

        },

    ],

}



const result =
    analyzer.analyze(
        graph
    )


console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
