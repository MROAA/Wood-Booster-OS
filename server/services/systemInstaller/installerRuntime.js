/*
=====================================

WOOD-BOOSTER HQ INSTALLER V2

INSTALLER RUNTIME

Vastuut:

- tunnistaa ajonaikainen ympäristö
- kerää Node tiedot
- kerää käyttöjärjestelmän tiedot
- ei muuta järjestelmää
- ei suorita asennuksia

=====================================
*/

import os from "os"



function getInstallerRuntime(){

    return {

        runtime: {

            nodeVersion:
                process.version,


            platform:
                process.platform,


            architecture:
                process.arch,


            pid:
                process.pid,


            cwd:
                process.cwd(),

        },


        system: {

            hostname:
                os.hostname(),


            cpuCount:
                os.cpus().length,


            memory: {

                total:
                    os.totalmem(),


                free:
                    os.freemem(),

            },


        },


        checkedAt:
            new Date()
            .toISOString(),

    }

}



export {

    getInstallerRuntime,

}
