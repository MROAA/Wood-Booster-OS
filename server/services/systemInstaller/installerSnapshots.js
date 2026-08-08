/*
=====================================

WOOD-BOOSTER OS INSTALLER V3

INSTALLER SNAPSHOT MANAGER V2

Vastuut:

- tarkistaa snapshot-rakenteen
- lukee snapshot metadataa
- listaa snapshotit
- näyttää viimeisimmän snapshotin

Ei:

- luo snapshotteja
- poista snapshotteja
- palauta järjestelmää

=====================================
*/


import fs from "fs"
import path from "path"



function getInstallerSnapshots(){


    const root =
        process.cwd()



    const snapshotRoot =
        path.join(
            root,
            "snapshots"
        )



    const exists =
        fs.existsSync(
            snapshotRoot
        )



    let snapshots = []



    if(exists){


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

            .map(
                item => {


                    const folder =
                        item.name



                    const metadataPath =
                        path.join(
                            snapshotRoot,
                            folder,
                            "metadata.json"
                        )



                    let metadata = null



                    if(
                        fs.existsSync(
                            metadataPath
                        )
                    ){

                        try {

                            metadata =
                                JSON.parse(
                                    fs.readFileSync(
                                        metadataPath,
                                        "utf-8"
                                    )
                                )

                        }

                        catch {

                            metadata = null

                        }

                    }



                    return {

                        id:
                            folder,


                        metadataPath,


                        metadata,

                    }


                }

            )


    }



    const count =
        snapshots.length



    const latest =

        count > 0

            ?
            snapshots[
                count - 1
            ]

            :

            null



    return {


        system:

            "Wood-Booster OS Snapshot Manager V2",



        status:

            count > 0
                ?
                "available"
                :
                "empty",



        snapshotPath:

            snapshotRoot,



        count,



        snapshots,



        latest,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerSnapshots,

}
