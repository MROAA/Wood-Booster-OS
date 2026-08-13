/*
=====================================

WOOD-BOOSTER HQ INSTALLER V2

INSTALLER VERSION

Vastuut:

- tunnistaa sovelluksen version
- lukee package.json tiedot
- ei muuta järjestelmää
- ei suorita asennuksia

=====================================
*/


import fs from "fs"
import path from "path"



function getInstallerVersion(){

    const root =
        process.cwd()



    const packagePath =
        path.join(
            root,
            "package.json"
        )



    let packageData =
        null



    if(
        fs.existsSync(packagePath)
    ){

        packageData =
            JSON.parse(
                fs.readFileSync(
                    packagePath,
                    "utf-8"
                )
            )

    }



    return {

        application: {

            name:
                packageData?.name
                ||
                "Wood-Booster HQ",


            version:
                packageData?.version
                ||
                "unknown",


            description:
                packageData?.description
                ||
                "",

        },


        package: {

            exists:
                fs.existsSync(
                    packagePath
                ),


            path:
                packagePath,

        },


        checkedAt:
            new Date()
            .toISOString(),

    }

}



export {

    getInstallerVersion,

}
