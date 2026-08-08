/*
=====================================

WOOD-BOOSTER HQ INSTALLER V3

SNAPSHOT HISTORY

Vastuut:

- muodostaa snapshot historian
- lukee olemassa olevat snapshotit
- järjestää aikajärjestykseen
- antaa yhteenvedon

Ei:

- luo snapshotteja
- muuta snapshotteja
- palauta järjestelmää

=====================================
*/


import {
    getInstallerSnapshots,
} from "./installerSnapshots.js"



function getInstallerSnapshotHistory(){


    const snapshotsData =
        getInstallerSnapshots()



    const snapshots =
        snapshotsData.snapshots || []



    const history =

        snapshots

        .filter(
            snapshot =>
                snapshot.metadata
        )

        .sort(
            (a,b) =>

                new Date(
                    b.metadata.createdAt
                )
                -
                new Date(
                    a.metadata.createdAt
                )
        )



    const latest =

        history.length > 0

            ?
            history[0]

            :
            null



    return {


        system:

            "Wood-Booster HQ Snapshot History",



        status:

            history.length > 0

                ?
                "available"

                :
                "empty",



        count:

            history.length,



        latest,



        history,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerSnapshotHistory,

}
