/*
=====================================

WOOD-BOOSTER OS INSTALLER V3

SNAPSHOT REPAIR READINESS

Vastuut:

- arvioi palautusvalmiuden
- tarkistaa validit snapshotit
- raportoi restore mahdollisuuden

Ei:

- palauta järjestelmää
- muuta tiedostoja
- suorita korjauksia

=====================================
*/


import {
    getInstallerSnapshotHistory,
} from "./installerSnapshotHistory.js"



import {
    getInstallerSnapshotValidator,
} from "./installerSnapshotValidator.js"



function getInstallerSnapshotRepair(){


    const history =
        getInstallerSnapshotHistory()



    const validator =
        getInstallerSnapshotValidator()



    const availableSnapshots =
        history.count || 0



    const canRestore =

        validator.status === "healthy"
        &&
        availableSnapshots > 0



    return {


        system:

            "Wood-Booster OS Snapshot Repair Readiness",



        status:

            canRestore
                ?
                "ready"
                :
                "unavailable",



        canRestore,



        score:

            canRestore
                ?
                100
                :
                0,



        snapshots:

            availableSnapshots,



        latestValidSnapshot:

            canRestore
                ?
                history.latest
                :
                null,



        validation:

            validator.status,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerSnapshotRepair,

}
