/*
=====================================

WOOD-BOOSTER HQ INSTALLER V3

INSTALLER RECOVERY

Vastuut:

- tarkistaa palautusvalmiuden
- tarkistaa snapshot-ympäristön
- tarkistaa backup-rakenteen
- raportoi recovery-tilan

Ei:

- tee varmuuskopioita
- palauta järjestelmää
- muuta tiedostoja

=====================================
*/


import fs from "fs"
import path from "path"



function checkExists(target){

    return fs.existsSync(target)

}



function getInstallerRecovery(){


    const root =
        process.cwd()



    const backupPaths = {


        backups:

            path.join(
                root,
                "backups"
            ),


        snapshots:

            path.join(
                root,
                "snapshots"
            ),


        backupSystem:

            path.join(
                root,
                "backup-system"
            ),

    }



    const checks = {


        backups: {

            exists:
                checkExists(
                    backupPaths.backups
                ),

        },



        snapshots: {

            exists:
                checkExists(
                    backupPaths.snapshots
                ),

        },



        backupSystem: {

            exists:
                checkExists(
                    backupPaths.backupSystem
                ),

        },

    }



    const available =

        Object.values(checks)
        .filter(
            item => item.exists
        )
        .length



    const total =

        Object.keys(checks)
        .length



    const score =

        Math.round(
            (
                available /
                total
            )
            *
            100
        )



    return {


        system:

            "Wood-Booster HQ Installer Recovery",



        status:

            score === 100
                ?
                "ready"
                :
                "partial",



        score,



        checks,



        paths:

            backupPaths,



        checkedAt:

            new Date()
            .toISOString(),

    }


}



export {

    getInstallerRecovery,

}
