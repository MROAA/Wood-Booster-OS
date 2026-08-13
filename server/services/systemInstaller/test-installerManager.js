import {
    getInstallerManager,
} from "./installerManager.js"



const result =
    getInstallerManager()



console.log(
    JSON.stringify(
        result,
        null,
        2
    )
)
