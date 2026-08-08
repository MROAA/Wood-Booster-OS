import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"



const __filename =
    fileURLToPath(import.meta.url)


const __dirname =
    path.dirname(__filename)



function findProjectRoot(){

    let current =
        __dirname



    while(
        current !== "/"
    ){

        if(
            fs.existsSync(
                path.join(
                    current,
                    "package.json"
                )
            )
            &&
            fs.existsSync(
                path.join(
                    current,
                    "server"
                )
            )
        ){

            return current

        }



        current =
            path.dirname(current)

    }



    return process.cwd()

}



function exists(target){

    return fs.existsSync(target)

}



function detectInstallation(root){


    const appImage =
        process.env.APPIMAGE
        ||
        null



    let packageType =
        "development"



    if(appImage){

        packageType =
            "AppImage"

    }



    if(
        root.includes(
            "/usr/lib/Wood-Booster OS"
        )
    ){

        packageType =
            "system-package"

    }



    return {

        packageType,


        appImage,


        executable:
            process.execPath,


        workingDirectory:
            root,

    }

}



function detectVersion(root){

    try {

        const pkg =
            JSON.parse(
                fs.readFileSync(
                    path.join(
                        root,
                        "package.json"
                    ),
                    "utf8"
                )
            )


        return pkg.version || "unknown"

    }
    catch {

        return "unknown"

    }

}



function getInstallerManager(){


    const root =
        findProjectRoot()



    return {


        system:
            "Wood-Booster OS Installer Manager",



        version:
            "1.0.0",



        installation:
            detectInstallation(
                root
            ),



        applicationVersion:
            detectVersion(
                root
            ),



        paths: {


            root,


            server:
                exists(
                    path.join(
                        root,
                        "server"
                    )
                ),



            frontend:
                exists(
                    path.join(
                        root,
                        "src"
                    )
                ),

        },



        checkedAt:
            new Date()
            .toISOString(),

    }

}



export {

    getInstallerManager,

}
