/*
=====================================

WOOD-BOOSTER HQ INSTALLER V3

SNAPSHOT ENGINE V3

Vastuut:

- luo snapshot metadata
- tallentaa snapshot tiedoston
- tallentaa runtime tiedot
- tallentaa projektitiedot
- raportoi snapshot tilan

Ei:

- kopioi koko projektia
- palauta järjestelmää
- muuta järjestelmää automaattisesti

=====================================
*/


import fs from "fs"
import path from "path"



function getProjectRoot(){


    const current =
        process.cwd()



    if(
        current.endsWith("/server")
    ){

        return path.resolve(
            current,
            ".."
        )

    }



    return current


}



function getSnapshotRoot(){


    if(
        process.env.WOOD_BOOSTER_DATA_DIR
    ){

        return path.join(
            process.env.WOOD_BOOSTER_DATA_DIR,
            "snapshots"
        )

    }


    return path.join(
        getProjectRoot(),
        "snapshots"
    )


}



function createSnapshot(){


    const root =
        getProjectRoot()



    const snapshotRoot =
        getSnapshotRoot()



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
                ),


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

            "Wood-Booster HQ Snapshot Engine V3",



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



function getSnapshotEngineStatus(){


    const snapshotRoot =
        getSnapshotRoot()



    const exists =
        fs.existsSync(
            snapshotRoot
        )



    let count = 0



    if(exists){


        count =

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

            .length


    }



    return {


        system:

            "Wood-Booster HQ Snapshot Engine Status",



        status:

            exists
                ?
                "ready"
                :
                "empty",



        snapshotPath:

            snapshotRoot,



        snapshotCount:

            count,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    createSnapshot,

    getSnapshotEngineStatus,

}
