/*
=====================================

WOOD-BOOSTER OS INSTALLER V3

SNAPSHOT ENGINE V2

Vastuut:

- luo snapshot metadata
- tallentaa snapshot tiedoston
- tallentaa runtime tiedot
- tallentaa projektitiedot

Ei:

- kopioi projektia
- palauta järjestelmää
- muuta järjestelmää

=====================================
*/


import fs from "fs"
import path from "path"



function getSnapshotEngine(){


    const root =
        process.cwd()



    const snapshotRoot =
        path.join(
            root,
            "snapshots"
        )



    const snapshotId =
        `snapshot-${Date.now()}`



    const snapshotPath =
        path.join(
            snapshotRoot,
            snapshotId
        )



    const metadataPath =
        path.join(
            snapshotPath,
            "metadata.json"
        )



    const metadata = {


        id:

            snapshotId,



        createdAt:

            new Date()
            .toISOString(),



        system: {

            platform:
                process.platform,


            nodeVersion:
                process.version,

        },



        project: {

            root,

        },



        git: {

            available:
                fs.existsSync(
                    path.join(
                        root,
                        ".git"
                    )
                )

        }


    }



    let created = false



    try {


        fs.mkdirSync(
            snapshotPath,
            {
                recursive: true
            }
        )



        fs.writeFileSync(
            metadataPath,
            JSON.stringify(
                metadata,
                null,
                2
            )
        )



        created = true


    }

    catch(error){


        created = false


    }



    return {


        system:

            "Wood-Booster OS Snapshot Engine V2",



        status:

            created
                ?
                "created"
                :
                "failed",



        created,



        snapshotId,



        snapshotPath,



        metadataPath,



        metadata,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getSnapshotEngine,

}
