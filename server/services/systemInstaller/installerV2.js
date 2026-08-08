/*
=====================================

WOOD-BOOSTER OS INSTALLER V3

INSTALLER CORE

Vastuut:

- yhdistää Installer moduulit
- muodostaa asennusyhteenvedon
- yhdistää Recovery valmiuden
- yhdistää Snapshot tilan
- yhdistää Snapshot Engine tilan

Ei:

- suorita asennuksia
- muuta järjestelmää
- palauta järjestelmää

=====================================
*/


import {
    getInstallerHealth,
} from "./installerHealth.js"



import {
    getInstallerReport,
} from "./installerReport.js"



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
    getInstallerRecovery,
} from "./installerRecovery.js"



import {
    getInstallerSnapshots,
} from "./installerSnapshots.js"



import {
    getSnapshotEngine,
} from "./installerSnapshotEngine.js"



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



    const recovery =
        getInstallerRecovery()



    const snapshots =
        getInstallerSnapshots()



    const snapshotEngine =
        getSnapshotEngine()



    const report =
        getInstallerReport()



    const score =

        Math.min(
            health.score,
            dependencies.score
        )



    return {


        system:

            "Wood-Booster OS Installer V3",



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



        recovery,



        snapshots,



        snapshotEngine,



        report,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerV2,

}
