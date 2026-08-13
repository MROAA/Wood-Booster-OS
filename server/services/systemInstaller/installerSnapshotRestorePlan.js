/*
=====================================

WOOD-BOOSTER HQ INSTALLER V3

SNAPSHOT RESTORE PLAN

Vastuut:

- muodostaa palautussuunnitelman
- valitsee validin snapshotin
- tarkistaa palautuksen edellytykset

Ei:

- palauta järjestelmää
- muuta tiedostoja
- suorita komentoja

=====================================
*/


import {
    getInstallerSnapshotRepair,
} from "./installerSnapshotRepair.js"



import {
    getInstallerSnapshotValidator,
} from "./installerSnapshotValidator.js"



function getInstallerSnapshotRestorePlan(){


    const repair =
        getInstallerSnapshotRepair()



    const validator =
        getInstallerSnapshotValidator()



    const ready =

        repair.canRestore
        &&
        validator.status === "healthy"



    return {


        system:

            "Wood-Booster HQ Snapshot Restore Plan",



        status:

            ready
                ?
                "ready"
                :
                "unavailable",



        requiresConfirmation:

            true,



        targetSnapshot:

            ready
                ?
                repair.latestValidSnapshot
                :
                null,



        validation:

            validator.status,



        steps:

            ready
                ?
                [
                    "validate snapshot",
                    "check metadata",
                    "prepare restore"
                ]
                :
                [],



        score:

            ready
                ?
                100
                :
                0,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerSnapshotRestorePlan,

}
