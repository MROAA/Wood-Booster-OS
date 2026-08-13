/*
=====================================

WOOD-BOOSTER HQ INSTALLER V2

INSTALLER DEPENDENCIES

Vastuut:

- tarkistaa ympäristön riippuvuudet
- tarkistaa projektirakenteen
- raportoi valmiustilan

Ei:

- asenna paketteja
- muuta järjestelmää
- suorita toimintoja

=====================================
*/


import fs from "fs"
import path from "path"
import {
    fileURLToPath
} from "url"



function checkExists(target){

    return fs.existsSync(target)

}



function getProjectRoot(){

    const currentFile =
        fileURLToPath(
            import.meta.url
        )


    const installerDirectory =
        path.dirname(
            currentFile
        )


    return path.resolve(
        installerDirectory,
        "../../.."
    )

}



function getInstallerDependencies(){

    const root =
        getProjectRoot()



    const checks = {


        node: {

            exists:
                !!process.version,


            version:
                process.version,

        },



        npm: {

            exists:
                checkExists(
                    path.join(
                        root,
                        "package.json"
                    )
                ),

        },



        package: {

            exists:
                checkExists(
                    path.join(
                        root,
                        "package.json"
                    )
                ),

        },



        server: {

            exists:
                checkExists(
                    path.join(
                        root,
                        "server"
                    )
                ),

        },



        frontend: {

            exists:
                checkExists(
                    path.join(
                        root,
                        "src"
                    )
                ),

        },



        resources: {

            exists:
                checkExists(
                    path.join(
                        root,
                        "src-tauri",
                        "resources"
                    )
                ),

        },


    }



    const passed =
        Object.values(checks)
        .filter(
            item => item.exists
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

            "Wood-Booster HQ Installer Dependency Check",



        root,



        status:

            score === 100
                ?
                "healthy"
                :
                "warning",



        score,



        checks,



        checkedAt:

            new Date()
            .toISOString(),

    }

}



export {

    getInstallerDependencies,

}
