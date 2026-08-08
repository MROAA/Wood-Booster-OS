/*
=====================================

WOOD-BOOSTER HQ INSTALLER V3

SNAPSHOT CREATOR

Vastuut:

- hallittu snapshotin luonti
- käyttää Snapshot Engineä
- palauttaa luontituloksen

Ei:

- automaattista snapshot luontia
- palautusta
- järjestelmän muutoksia

=====================================
*/


import {
    createSnapshot,
} from "./installerSnapshotEngine.js"



function createInstallerSnapshot(){


    const snapshot =
        createSnapshot()



    return {


        system:

            "Wood-Booster HQ Snapshot Creator",



        status:

            snapshot.created
                ?
                "created"
                :
                "failed",



        created:

            snapshot.created,



        snapshotId:

            snapshot.snapshotId,



        snapshotPath:

            snapshot.snapshotPath,



        metadataPath:

            snapshot.metadataPath,



        metadata:

            snapshot.metadata,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    createInstallerSnapshot,

}
