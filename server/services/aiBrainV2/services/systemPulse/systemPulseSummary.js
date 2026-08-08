/*
=====================================

WOOD-BOOSTER AI BRAIN V2

SYSTEM PULSE SUMMARY

Vastuut:

- muodostaa selkeän järjestelmäyhteenvedon
- yhdistää System Pulse tiedot
- tarjoaa frontendille helposti luettavan tilan
- yhdistää Installer V2 tiedon

Ei:

- suorita toimintoja
- muuta järjestelmää
- tee päätöksiä

=====================================
*/


import {
    getSystemPulse,
} from "./systemPulseService.js"


import {
    getInstallerV2,
} from "../../../systemInstaller/installerV2.js"



async function getSystemPulseSummary(){


    const pulse =
        await getSystemPulse()



    const installer =
        getInstallerV2()



    const capability =
        pulse.components.capability


    const runtime =
        pulse.components.runtime


    const modules =
        pulse.components.modules


    const security =
        pulse.components.security


    const securityHealth =
        pulse.components.securityHealth


    const hardware =
        pulse.components.hardware


    const git =
        pulse.components.git


    const gitSync =
        pulse.components.gitSync


    const gitWatcher =
        pulse.components.gitWatcher


    const gitHistory =
        pulse.components.gitHistory


    const gitSummary =
        pulse.components.gitSummary


    const healthScore =
        pulse.components.healthScore



    return {


        status:
            pulse.status,


        healthy:
            pulse.healthy,



        summary: {


            system:
                pulse.system,



            installer,



            healthScore: {


                score:
                    healthScore?.score
                    ??
                    0,


                status:
                    healthScore?.status
                    ||
                    "unknown",


                details:
                    healthScore?.details
                    ||
                    [],

            },



            modules: {


                total:
                    modules.total,


                active:
                    modules.active,


                status:
                    modules.active === modules.total
                        ?
                        "healthy"
                        :
                        "degraded",

            },



            capability: {


                approved:
                    capability.summary.approved,


                blocked:
                    capability.summary.blocked,


                approvalRequired:
                    capability.summary.approvalRequired,

            },



            security: {


                status:
                    securityHealth?.status
                    ||
                    security.status
                    ||
                    "available",



                blockedEvents:
                    securityHealth?.blockedEvents
                    ??
                    0,



                approvalRequired:
                    securityHealth?.approvalRequired
                    ??
                    0,



                message:
                    securityHealth?.message
                    ||
                    "",

            },



            environment: {


                os:
                    runtime.platform
                    ||
                    "-",


                kernel:
                    hardware.kernel
                    ||
                    "-",


                host:
                    hardware.hostname
                    ||
                    "-",


            },



            hardware: {


                cpu:
                    hardware.cpu
                    ||
                    null,


                gpu:
                    hardware.gpu
                    ||
                    null,


                memory:
                    hardware.memory
                    ||
                    null,

            },



            runtime: {


                platform:
                    runtime.platform,


                nodeVersion:
                    runtime.nodeVersion,


                cpuCount:
                    runtime.cpuCount,

            },



            git: {


                repository:
                    git.repository
                    ||
                    "-",


                branch:
                    git.branch
                    ||
                    "-",


                commit:
                    git.commit
                    ||
                    "-",


            },



            gitSync: {


                status:
                    gitSync.status
                    ||
                    "-",


                changes:
                    gitSync.changes
                    ||
                    0,

            },



            gitWatcher: {


                status:
                    gitWatcher.status
                    ||
                    "stopped",

            },



            gitHistory: {


                total:
                    gitHistory?.total
                    ||
                    0,


                events:
                    gitHistory?.events
                    ||
                    [],

            },



            gitSummary,

        },



        checkedAt:
            pulse.checkedAt,


    }

}



export {

    getSystemPulseSummary,

}