/*
=====================================

WOOD-BOOSTER HQ INSTALLER V3

INSTALLER CORE

Vastuut:

- yhdistää Installer moduulit
- muodostaa asennusyhteenvedon
- yhdistää Recovery valmiuden
- yhdistää Snapshot järjestelmän
- yhdistää Snapshot Historian
- yhdistää Snapshot Validatorin
- yhdistää Snapshot Repair Readinessin
- yhdistää Snapshot Restore Planin
- yhdistää Snapshot Restore Approvalin

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
getSnapshotEngineStatus,
} from "./installerSnapshotEngine.js"


import {
getInstallerSnapshotHistory,
} from "./installerSnapshotHistory.js"


import {
getInstallerSnapshotValidator,
} from "./installerSnapshotValidator.js"


import {
getInstallerSnapshotRepair,
} from "./installerSnapshotRepair.js"


import {
getInstallerSnapshotRestorePlan,
} from "./installerSnapshotRestorePlan.js"


import {
getInstallerRestoreApproval,
} from "./installerRestoreApproval.js"



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
    getSnapshotEngineStatus()



const snapshotHistory =
    getInstallerSnapshotHistory()



const snapshotValidator =
    getInstallerSnapshotValidator()



const snapshotRepair =
    getInstallerSnapshotRepair()



const snapshotRestorePlan =
    getInstallerSnapshotRestorePlan()



const snapshotRestoreApproval =
    getInstallerRestoreApproval({

        restorePlan:
            snapshotRestorePlan,

        confirmed:
            false

    })



const report =
    getInstallerReport()



const score =

    Math.min(
        health.score,
        dependencies.score,
        snapshotValidator.score,
        snapshotRepair.score,
        snapshotRestorePlan.score
    )



return {


    system:

        "Wood-Booster HQ Installer V3",



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



    snapshotHistory,



    snapshotValidator,



    snapshotRepair,



    snapshotRestorePlan,


    snapshotRestoreApproval,



    report,



    checkedAt:

        new Date()
        .toISOString(),

}


}



export {

getInstallerV2,

}
