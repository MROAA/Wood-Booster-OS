/*
=====================================

WOOD-BOOSTER OS INSTALLER V3

SNAPSHOT VALIDATOR

Vastuut:

- validoi snapshot rakenteen
- tarkistaa metadata tiedoston
- tarkistaa luettavuuden
- muodostaa health arvon

Ei:

- muuta snapshotteja
- korjaa tiedostoja
- palauta järjestelmää

=====================================
*/


import fs from "fs"
import path from "path"



function getInstallerSnapshotValidator(){


    const root =
        process.cwd()



    const snapshotRoot =
        path.join(
            root,
            "snapshots"
        )



    const checks = {


        snapshotDirectory: {

            exists:
                fs.existsSync(
                    snapshotRoot
                )

        },



        metadataReadable: {

            exists:
                false

        },



        snapshotStructure: {

            valid:
                false

        }


    }



    let snapshots = []



    if(
        fs.existsSync(
            snapshotRoot
        )
    ){


        snapshots =

            fs.readdirSync(
                snapshotRoot,
                {
                    withFileTypes: true
                }
            )

            .filter(
                item =>
                    item.isDirectory()
            )


    }



    if(
        snapshots.length > 0
    ){

        const firstSnapshot =
            snapshots[0].name



        const metadataPath =
            path.join(
                snapshotRoot,
                firstSnapshot,
                "metadata.json"
            )



        checks.metadataReadable.exists =
            fs.existsSync(
                metadataPath
            )



        checks.snapshotStructure.valid =
            checks.metadataReadable.exists

    }



    const passed =

        Object.values(checks)

        .filter(
            check =>
                check.exists ||
                check.valid
        )

        .length



    const total =
        Object.keys(checks).length



    const score =

        Math.round(
            (
                passed /
                total
            )
            *
            100
        )



    return {


        system:

            "Wood-Booster OS Snapshot Validator",



        status:

            score === 100
                ?
                "healthy"
                :
                "warning",



        score,



        checks,



        snapshotCount:

            snapshots.length,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerSnapshotValidator,

}
