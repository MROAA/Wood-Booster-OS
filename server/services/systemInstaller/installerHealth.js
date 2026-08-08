import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"



const __filename =
    fileURLToPath(import.meta.url)


const __dirname =
    path.dirname(__filename)



const projectRoot =
    path.resolve(
        __dirname,
        "../../.."
    )



function checkPath(target){

    return {

        exists:
            fs.existsSync(target),


        path:
            target,

    }

}



function findResourcePath(name){

    const roots = [

        path.join(
            projectRoot,
            "resources"
        ),


        path.join(
            projectRoot,
            "src-tauri",
            "resources"
        ),

    ]



    for(
        const root of roots
    ){

        const target =
            path.join(
                root,
                name
            )


        if(
            fs.existsSync(target)
        ){

            return target

        }

    }



    return path.join(
        projectRoot,
        "src-tauri",
        "resources",
        name
    )

}



function getInstallerHealth(){


    const checks = {


        serverResources:

            checkPath(
                findResourcePath(
                    "server"
                )
            ),



        servicesResources:

            checkPath(
                findResourcePath(
                    "services"
                )
            ),



        package:

            checkPath(
                path.join(
                    projectRoot,
                    "package.json"
                )
            ),



        server:

            checkPath(
                path.join(
                    projectRoot,
                    "server"
                )
            ),

    }



    const passed =
        Object.values(checks)
        .filter(
            item =>
                item.exists
        )
        .length



    const total =
        Object.keys(checks)
        .length



    return {

        system:
            "Wood-Booster OS Installer Health",



        version:
            "1.0.0",



        status:
            passed === total
                ? "healthy"
                : "degraded",



        installed:
            passed === total,



        score:
            Math.round(
                (passed / total) * 100
            ),



        checks,



        checkedAt:
            new Date().toISOString(),

    }

}



export {

    getInstallerHealth,

}
