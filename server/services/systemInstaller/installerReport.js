/*
=====================================

WOOD-BOOSTER OS INSTALLER V2

INSTALLER REPORT

Vastuut:

- muodostaa ihmisen luettavan raportin
- yhdistää Installer moduulien tiedot

Ei:

- suorita asennuksia
- muuta järjestelmää

=====================================
*/


import {
getInstallerHealth,
} from "./installerHealth.js"


import {
getInstallerDependencies,
} from "./installerDependencies.js"


import {
getInstallerRuntime,
} from "./installerRuntime.js"


import {
getInstallerSystem,
} from "./installerSystem.js"



function getInstallerReport(){


    const health =
        getInstallerHealth()



    const dependencies =
        getInstallerDependencies()



    const runtime =
        getInstallerRuntime()



    const system =
        getInstallerSystem()



    const score =
        Math.min(
            health.score,
            dependencies.score
        )



    const ready =
        score === 100



    return {


        system:

            "Wood-Booster OS Installation Report",



        status:

            ready
                ?
                "READY"
                :
                "CHECK REQUIRED",



        score,



        health: {

            status:
                health.status,


            score:
                health.score,

        },



        dependencies: {

            status:
                dependencies.status,


            score:
                dependencies.score,

        },



        runtime,



        systemInfo:
            system,



        recommendation:

            ready
                ?
                "System ready for operation"
                :
                "Review installer checks",



        checkedAt:

            new Date()
            .toISOString(),

    }

}



export {

    getInstallerReport,

}
