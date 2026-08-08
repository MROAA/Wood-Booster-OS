/*
=====================================

WOOD-BOOSTER OS INSTALLER V2

INSTALLER SYSTEM

Vastuut:

- kerää järjestelmän perustiedot
- tunnistaa käyttöympäristön
- ei muuta järjestelmää
- ei suorita toimintoja

=====================================
*/


import os from "os"



function getInstallerSystem(){

    return {

        operatingSystem: {

            platform:
                process.platform,


            release:
                os.release(),


            type:
                os.type(),


            hostname:
                os.hostname(),

        },


        user: {

            username:
                os.userInfo().username,


            home:
                os.homedir(),

        },


        environment: {

            shell:
                process.env.SHELL
                ||
                null,


            path:
                process.env.PATH
                ||
                null,

        },


        checkedAt:
            new Date()
            .toISOString(),

    }

}



export {

    getInstallerSystem,

}
