/*
=====================================

WOOD-BOOSTER OS INSTALLER V2

INSTALLER CORE

Vastuut:

- yhdistää Installer moduulit
- muodostaa asennusyhteenvedon
- ei suorita asennuksia
- ei muuta järjestelmää

=====================================
*/


import {
getInstallerHealth,
} from "./installerHealth.js"



import {
getInstallerManager,
} from "./installerManager.js"



import {
getInstallerRuntime,
} from "./installerRuntime.js"



import {
getInstallerVersion,
} from "./installerVersion.js"



import {
getInstallerSystem,
} from "./installerSystem.js"



import {
getInstallerDependencies,
} from "./installerDependencies.js"



import {
getInstallerReport,
} from "./installerReport.js"



function getInstallerV2(){


    const health =
        getInstallerHealth()



    const manager =
        getInstallerManager()



    const runtime =
        getInstallerRuntime()



    const version =
        getInstallerVersion()



    const system =
        getInstallerSystem()



    const dependencies =
        getInstallerDependencies()



    const report =
        getInstallerReport()



    const score =
        Math.min(
            health.score,
            dependencies.score
        )



    return {


        system:

            "Wood-Booster OS Installer V2",



        status:

            score === 100
                ?
                "healthy"
                :
                "warning",



        score,



        health,



        manager,



        runtime,



        version,



        systemInfo:

            system,



        dependencies,



        report,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerV2,

}
